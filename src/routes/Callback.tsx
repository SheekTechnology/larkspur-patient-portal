import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completeLogin, OAuthError } from '../knack/oauth'
import { saveTokens } from '../knack/tokens'
import { useSession } from '../knack/session'
import { ErrorBanner, Spinner } from '../components/ui'

export function Callback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useSession()
  const [error, setError] = useState<unknown>(null)
  const ran = useRef(false)

  useEffect(() => {
    // Auth codes are single-use; StrictMode double-invoke would burn it.
    if (ran.current) return
    ran.current = true

    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')

    if (oauthError) {
      setError(new OAuthError(oauthError, params.get('error_description') ?? 'Knack rejected the sign-in.'))
      return
    }
    if (!code || !state) {
      setError(new OAuthError('missing_code', 'Knack did not return an authorization code.'))
      return
    }

    completeLogin(code, state)
      .then((tokens) => {
        saveTokens(tokens)
        return refresh()
      })
      .then(() => navigate('/', { replace: true }))
      .catch(setError)
  }, [params, navigate, refresh])

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md">
          <ErrorBanner error={error} />
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return <div className="grid min-h-screen place-items-center"><Spinner label="Completing sign-in…" /></div>
}
