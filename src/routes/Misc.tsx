import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/ui'
import { roleLabels, roleRoutes } from '../knack/config'
import { useSession } from '../knack/session'

/** Landing page for users with no specific role (`all_users` only). Never an error. */
export function Welcome() {
  const { user } = useSession()
  return (
    <AppShell title={`Hello, ${user?.fullName ?? ''}`} subtitle="Your account is active.">
      <Card className="p-8">
        <p className="font-medium">No role has been assigned to your account yet.</p>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Once the clinic assigns you a role in Knack, your appointments and documents will appear here.
          Nothing is wrong with your sign-in.
        </p>
      </Card>
    </AppShell>
  )
}

/** Shown when a user holds more than one role — each view stays self-contained. */
export function RoleSelect() {
  const { user } = useSession()
  const keys = (user?.profileKeys ?? []).filter((k) => roleRoutes[k])

  return (
    <AppShell title="Choose a view" subtitle="Your account has more than one role.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => (
          <Link
            key={k}
            to={roleRoutes[k]}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-larkspur-400 hover:shadow"
          >
            <p className="font-medium">{roleLabels[k] ?? k}</p>
            <p className="mt-1 text-sm text-slate-500">Open the {(roleLabels[k] ?? k).toLowerCase()} view</p>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}

export function Unauthorized() {
  return (
    <AppShell title="Not available" subtitle="This view isn't part of your role.">
      <Card className="p-8">
        <p className="text-sm text-slate-600">
          Your account doesn't have access to that section.{' '}
          <Link to="/" className="font-medium text-larkspur-700 underline">Go back</Link>
        </p>
      </Card>
    </AppShell>
  )
}
