import type { TokenResponse } from './oauth'

/** Tokens live in sessionStorage: tab-scoped, and gone when the tab closes. */
const KEY = 'knack.tokens'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  /** Epoch ms when the access token expires. */
  expiresAt: number
}

export function saveTokens(t: TokenResponse): StoredTokens {
  const stored: StoredTokens = {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
  }
  sessionStorage.setItem(KEY, JSON.stringify(stored))
  return stored
}

export function loadTokens(): StoredTokens | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredTokens
  } catch {
    sessionStorage.removeItem(KEY)
    return null
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(KEY)
}

/** Refresh proactively inside this window rather than waiting for a 401. */
export const REFRESH_MARGIN_MS = 60_000

export function isExpiring(t: StoredTokens): boolean {
  return Date.now() >= t.expiresAt - REFRESH_MARGIN_MS
}
