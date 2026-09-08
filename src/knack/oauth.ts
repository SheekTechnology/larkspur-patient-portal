import { API_BASE, CLIENT_ID } from './config'

/** Client-side OAuth 2.0 Authorization Code + PKCE. No server runtime involved. */

const VERIFIER_KEY = 'knack.pkce.verifier'
const STATE_KEY = 'knack.pkce.state'

export const REDIRECT_URI = `${window.location.origin}/auth/callback`

function base64url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBase64url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

async function sha256Base64url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return base64url(new Uint8Array(digest))
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

/** Readable OAuth failure — Knack returns { error, error_description }. */
export class OAuthError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message)
    this.name = 'OAuthError'
  }
}

async function postForm(path: string, body: Record<string, string>): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
}

async function readTokenResponse(res: Response): Promise<TokenResponse> {
  const text = await res.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new OAuthError('invalid_response', text || 'Empty response from Knack', res.status)
  }
  if (!res.ok) {
    throw new OAuthError(
      json.error ?? 'unknown_error',
      json.error_description ?? JSON.stringify(json),
      res.status,
    )
  }
  return json as TokenResponse
}

/** Step 2 + 3: build PKCE params, stash them, and hand back the authorize URL. */
export async function beginLogin(): Promise<string> {
  const codeVerifier = randomBase64url(48)
  const state = randomBase64url(16)
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: await sha256Base64url(codeVerifier),
    code_challenge_method: 'S256',
    state,
  })
  return `${API_BASE}/v1/oauth/authorize?${params.toString()}`
}

/** Step 5: validate state, then trade the single-use code for tokens. */
export async function completeLogin(code: string, returnedState: string): Promise<TokenResponse> {
  const codeVerifier = sessionStorage.getItem(VERIFIER_KEY)
  const expectedState = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)

  if (!codeVerifier || !expectedState) {
    throw new OAuthError(
      'missing_pkce_state',
      'Login could not be completed because this browser tab has no record of starting it. Tokens are tab-scoped — start the login again in this tab.',
    )
  }
  if (returnedState !== expectedState) {
    throw new OAuthError('state_mismatch', 'Login blocked: the state parameter did not match. Start again.')
  }

  return readTokenResponse(
    await postForm('/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  )
}

/** Step 6: both tokens rotate on every refresh. */
export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return readTokenResponse(
    await postForm('/v1/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  )
}

/** Step 7: revokes every token for this (user, client) pair. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await postForm('/v1/oauth/revoke', { token, client_id: CLIENT_ID })
  } catch {
    // Logout must clear local state even if the network call fails.
  }
}
