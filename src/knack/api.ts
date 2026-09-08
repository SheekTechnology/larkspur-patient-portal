import { API_BASE, APP_ID } from './config'
import { refreshTokens } from './oauth'
import { clearTokens, isExpiring, loadTokens, saveTokens } from './tokens'

/**
 * A Knack API failure, carrying enough detail to be shown to the user verbatim.
 * Errors are never swallowed — a silent failure is impossible to report.
 */
export class KnackApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string | undefined,
    message: string,
    public path: string,
  ) {
    super(message)
    this.name = 'KnackApiError'
  }

  /** True when the API refused because of Data Access Control. */
  get isAccessControl(): boolean {
    return this.status === 403
  }
}

let inFlightRefresh: Promise<string> | null = null

/** Returns a usable access token, refreshing once if it is at or near expiry. */
async function getAccessToken(): Promise<string> {
  const tokens = loadTokens()
  if (!tokens) throw new KnackApiError(401, 'no_session', 'You are not signed in.', '')

  if (!isExpiring(tokens)) return tokens.accessToken

  // Collapse concurrent refreshes — both tokens rotate, so a second call would fail.
  if (!inFlightRefresh) {
    inFlightRefresh = refreshTokens(tokens.refreshToken)
      .then((next) => saveTokens(next).accessToken)
      .finally(() => {
        inFlightRefresh = null
      })
  }
  return inFlightRefresh
}

async function parseError(res: Response, path: string): Promise<KnackApiError> {
  const text = await res.text()
  let code: string | undefined
  let message = text

  try {
    const json = JSON.parse(text)
    code = json.errorCode ?? json.error
    message =
      json.error_description ??
      json.message ??
      (Array.isArray(json.errors) ? json.errors.map((e: any) => e.message ?? String(e)).join('; ') : null) ??
      text
  } catch {
    // Non-JSON body — keep the raw text.
  }

  if (res.status === 403 && !code) code = 'access_control_forbidden'
  return new KnackApiError(res.status, code, message || res.statusText, path)
}

/** Authenticated request against the Knack Live-App API. */
export async function knackFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'X-Knack-Application-Id': APP_ID,
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (res.status === 401 && retry) {
    const tokens = loadTokens()
    if (tokens) {
      try {
        saveTokens(await refreshTokens(tokens.refreshToken))
        return knackFetch<T>(path, init, false)
      } catch {
        clearTokens()
      }
    }
    throw new KnackApiError(401, 'invalid_token', 'Your session has expired. Please sign in again.', path)
  }

  if (!res.ok) throw await parseError(res, path)
  return (await res.json()) as T
}

export interface KnackSession {
  session: {
    user: {
      id: string
      name?: { fullName?: string }
      email?: string
      profileKeys: string[]
    }
  }
}

export function fetchSession(): Promise<KnackSession> {
  return knackFetch<KnackSession>(`/v1/live-app/${APP_ID}/session`)
}

export interface KnackRecord {
  id: string
  [field: string]: any
}

export interface RecordPage<T = KnackRecord> {
  records: T[]
  total_records: number
  total_pages: number
  current_page: number
}

export interface FilterRule {
  field: string
  operator: string
  value?: unknown
}

export interface ListOptions {
  rowsPerPage?: number
  page?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  /** Server-side filters. Never filter by the logged-in user — DAC does that. */
  filters?: { match: 'and' | 'or'; rules: FilterRule[] }
}

export function listRecords<T = KnackRecord>(
  objectKey: string,
  opts: ListOptions = {},
): Promise<RecordPage<T>> {
  const params = new URLSearchParams()
  params.set('rows_per_page', String(opts.rowsPerPage ?? 25))
  if (opts.page) params.set('page', String(opts.page))
  if (opts.sortField) params.set('sort_field', opts.sortField)
  if (opts.sortOrder) params.set('sort_order', opts.sortOrder)
  if (opts.filters) params.set('filters', JSON.stringify(opts.filters))

  return knackFetch<RecordPage<T>>(`/v1/objects/${objectKey}/records?${params.toString()}`)
}
