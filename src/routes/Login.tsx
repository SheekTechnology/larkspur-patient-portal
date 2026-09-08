import { useState } from 'react'
import { beginLogin } from '../knack/oauth'
import { ErrorBanner } from '../components/ui'

export function Login() {
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      // Knack hosts the login page — credentials never touch this app.
      window.location.assign(await beginLogin())
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-larkspur-600 text-lg font-semibold text-white">L</div>
          <h1 className="text-xl font-semibold tracking-tight">Larkspur Patient Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to view your appointments and documents.</p>
        </div>

        <button
          onClick={() => void start()}
          disabled={busy}
          className="w-full rounded-lg bg-larkspur-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-larkspur-700 disabled:opacity-60"
        >
          {busy ? 'Redirecting…' : 'Sign in with Knack'}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          You'll be taken to Knack's secure sign-in page.
        </p>

        {error ? <div className="mt-6"><ErrorBanner error={error} /></div> : null}
      </div>
    </div>
  )
}
