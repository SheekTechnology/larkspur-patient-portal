import { AppShell } from '../components/AppShell'
import { AppointmentList } from '../components/AppointmentList'
import { Card, ErrorBanner, Spinner } from '../components/ui'
import { F, OBJ } from '../knack/config'
import { isUpcoming } from '../knack/format'
import { useRecords } from '../knack/useRecords'
import { useSession } from '../knack/session'

export function ProviderView() {
  const { user } = useSession()
  const appts = useRecords(OBJ.appointments, { rowsPerPage: 100, sortField: F.appt.date, sortOrder: 'asc' })
  const patients = useRecords(OBJ.patients, { rowsPerPage: 100 })

  const upcoming = appts.records.filter((r) => isUpcoming(r, F.appt.date))
  const past = appts.records.filter((r) => !isUpcoming(r, F.appt.date)).reverse()

  return (
    <AppShell title={`Dr. ${user?.fullName ?? ''}`} subtitle="Your schedule and patient roster.">
      {appts.error ? <div className="mb-6"><ErrorBanner error={appts.error} onRetry={appts.reload} /></div> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming visits" value={appts.loading ? '—' : String(upcoming.length)} />
        <Stat label="Completed visits" value={appts.loading ? '—' : String(past.length)} />
        <Stat label="Patients" value={patients.loading ? '—' : String(patients.total)} />
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming schedule</h2>
          {appts.loading ? <Card><Spinner /></Card> : (
            <AppointmentList records={upcoming} showPatient showProvider={false} emptyTitle="Nothing scheduled" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent visits</h2>
          {appts.loading ? <Card><Spinner /></Card> : (
            <AppointmentList records={past.slice(0, 10)} showPatient showProvider={false} emptyTitle="No past visits" />
          )}
        </section>
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  )
}
