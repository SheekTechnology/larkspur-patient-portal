import { AppShell } from '../components/AppShell'
import { AppointmentList } from '../components/AppointmentList'
import { Card, ErrorBanner, Spinner } from '../components/ui'
import { F, OBJ } from '../knack/config'
import { isUpcoming } from '../knack/format'
import { useRecords } from '../knack/useRecords'
import { useSession } from '../knack/session'

export function ProviderView() {
  const { user } = useSession()

  // Appointments are owned by the patient, so Data Access Control cannot also scope
  // them to the provider — a record has a single owner. This filter narrows the view
  // to this provider's own schedule.
  //
  // Note this is a UI convenience, not a security boundary: the Providers role is
  // permitted to read every appointment. Making it a real boundary means changing
  // Data Access Control, not this file.
  const providerRecordId = user?.roleRecordIds['profile_5']

  const appts = useRecords(providerRecordId ? OBJ.appointments : null, {
    rowsPerPage: 100,
    sortField: F.appt.date,
    sortOrder: 'asc',
    filters: providerRecordId
      ? { match: 'and', rules: [{ field: F.appt.provider, operator: 'is', value: providerRecordId }] }
      : undefined,
  })
  const patients = useRecords(OBJ.patients, { rowsPerPage: 100 })

  const upcoming = appts.records.filter((r) => isUpcoming(r, F.appt.date))
  const past = appts.records.filter((r) => !isUpcoming(r, F.appt.date)).reverse()

  return (
    <AppShell title={`Dr. ${user?.fullName ?? ''}`} subtitle="Your schedule.">
      {appts.error ? <div className="mb-6"><ErrorBanner error={appts.error} onRetry={appts.reload} /></div> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Your upcoming visits" value={appts.loading ? '—' : String(upcoming.length)} />
        <Stat label="Your completed visits" value={appts.loading ? '—' : String(past.length)} />
        <Stat label="Patients in clinic" value={patients.loading ? '—' : String(patients.total)} />
      </div>

      {!appts.loading && !providerRecordId && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No Providers record is linked to this account, so no schedule can be shown.
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your upcoming schedule</h2>
          {appts.loading ? <Card><Spinner /></Card> : (
            <AppointmentList records={upcoming} showPatient showProvider={false} emptyTitle="Nothing scheduled for you" />
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
