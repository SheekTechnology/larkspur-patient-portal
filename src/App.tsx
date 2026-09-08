import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SessionProvider, useSession } from './knack/session'
import { roleRoutes } from './knack/config'
import { ErrorBanner, Spinner } from './components/ui'
import { Login } from './routes/Login'
import { Callback } from './routes/Callback'
import { RoleSelect, Unauthorized, Welcome } from './routes/Misc'
import { PatientView } from './views/PatientView'
import { ProviderView } from './views/ProviderView'
import { AdminView } from './views/AdminView'
import { loadTokens } from './knack/tokens'

/** Redirects to the OAuth flow when there is no session. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, error } = useSession()
  const location = useLocation()

  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Checking your session…" /></div>
  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md space-y-4">
          <ErrorBanner error={error} />
          <a href="/login" className="block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** Only lets a role's own users into that role's view. */
function RoleRoute({ profileKey, children }: { profileKey: string; children: ReactNode }) {
  const { user } = useSession()
  if (!user?.profileKeys.includes(profileKey)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

/** Sends each user to the right place based on the roles Knack reports. */
function Home() {
  const { user } = useSession()
  const keys = user?.profileKeys ?? []
  const known = keys.filter((k) => roleRoutes[k] && k !== 'all_users')

  if (known.length === 1) return <Navigate to={roleRoutes[known[0]]} replace />
  if (known.length > 1) return <Navigate to="/role-select" replace />
  return <Navigate to="/welcome" replace />
}

function LoginGate() {
  return loadTokens() ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/auth/callback" element={<Callback />} />

        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/welcome" element={<RequireAuth><Welcome /></RequireAuth>} />
        <Route path="/role-select" element={<RequireAuth><RoleSelect /></RequireAuth>} />
        <Route path="/unauthorized" element={<RequireAuth><Unauthorized /></RequireAuth>} />

        <Route path="/patient" element={<RequireAuth><RoleRoute profileKey="profile_4"><PatientView /></RoleRoute></RequireAuth>} />
        <Route path="/provider" element={<RequireAuth><RoleRoute profileKey="profile_5"><ProviderView /></RoleRoute></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><RoleRoute profileKey="profile_8"><AdminView /></RoleRoute></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  )
}
