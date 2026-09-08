import type { ReactNode } from 'react'
import { useSession } from '../knack/session'
import { roleLabels } from '../knack/config'
import { Badge } from './ui'

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { user, logout } = useSession()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-larkspur-600 font-semibold text-white">L</div>
            <div>
              <p className="text-sm font-semibold leading-tight">Larkspur Patient Portal</p>
              <p className="text-xs text-slate-500">Powered by Knack</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium leading-tight">{user.fullName}</p>
                <div className="mt-0.5 flex justify-end gap-1">
                  {user.profileKeys.map((pk) => (
                    <Badge key={pk} tone="blue">{roleLabels[pk] ?? pk}</Badge>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
