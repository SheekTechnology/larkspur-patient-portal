import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSession, listRecords, KnackApiError } from './api'
import { profileToObject } from './config'
import { revokeToken } from './oauth'
import { clearTokens, loadTokens } from './tokens'

export interface SessionUser {
  /** Knack ACCOUNT id (object_1). Not valid for connection fields on role objects. */
  accountId: string
  fullName: string
  email?: string
  profileKeys: string[]
  /** profileKey -> that role object's record id. Use these for connection writes. */
  roleRecordIds: Record<string, string>
}

interface SessionState {
  user: SessionUser | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!loadTokens()) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { session } = await fetchSession()
      const profileKeys = session.user.profileKeys ?? []

      // Resolve each role-object record id. DAC guarantees the response contains
      // only this user's own record, so the first row is theirs.
      const roleRecordIds: Record<string, string> = {}
      await Promise.all(
        profileKeys.map(async (pk) => {
          const objectKey = profileToObject[pk]
          if (!objectKey) return
          try {
            const { records } = await listRecords(objectKey, { rowsPerPage: 1 })
            if (records[0]) roleRecordIds[pk] = records[0].id
          } catch (e) {
            // A role with no readable record is survivable — views handle the gap.
            if (!(e instanceof KnackApiError && e.isAccessControl)) throw e
          }
        }),
      )

      setUser({
        accountId: session.user.id,
        fullName: session.user.name?.fullName ?? 'Signed-in user',
        email: session.user.email,
        profileKeys,
        roleRecordIds,
      })
    } catch (e) {
      setError(e as Error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const logout = useCallback(async () => {
    const tokens = loadTokens()
    if (tokens) await revokeToken(tokens.accessToken)
    clearTokens()
    setUser(null)
    window.location.assign('/login')
  }, [])

  const value = useMemo<SessionState>(
    () => ({ user, loading, error, refresh: load, logout }),
    [user, loading, error, load],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
