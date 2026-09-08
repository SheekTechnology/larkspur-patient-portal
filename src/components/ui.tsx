import type { ReactNode } from 'react'
import { KnackApiError } from '../knack/api'
import { OAuthError } from '../knack/oauth'

/**
 * Errors are shown in full — message and code. Knack's guidance is explicit that
 * silent failures make debugging impossible; the user must be able to read and
 * copy the exact error.
 */
export function ErrorBanner({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null

  let title = 'Something went wrong'
  let detail = error instanceof Error ? error.message : String(error)
  let code: string | undefined
  let hint: string | undefined

  if (error instanceof KnackApiError) {
    title = `Knack API error (HTTP ${error.status})`
    code = error.errorCode
    if (error.isAccessControl) {
      title = 'Access denied by Knack'
      hint = 'Data Access Control refused this request. Your role does not have permission for these records.'
    }
  } else if (error instanceof OAuthError) {
    title = 'Sign-in error'
    code = error.code
    if (error.code === 'auth_request_expired') {
      hint = 'This usually means the redirect URL is not registered with the Knack OAuth client, or the code expired.'
    } else if (error.code === 'login_pending_approval') {
      hint = 'This account is awaiting approval in Knack.'
    } else if (error.code === 'login_disactivated') {
      hint = 'This account is inactive in Knack.'
    }
  }

  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
      <p className="font-semibold text-red-900">{title}</p>
      {code && <p className="mt-1 font-mono text-xs text-red-700">code: {code}</p>}
      <p className="mt-2 whitespace-pre-wrap break-words text-red-800">{detail}</p>
      {hint && <p className="mt-2 text-red-700">{hint}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-larkspur-600" />
      {label}
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="p-8 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'blue' | 'red' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-larkspur-100 text-larkspur-800',
    red: 'bg-red-100 text-red-800',
  }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}
