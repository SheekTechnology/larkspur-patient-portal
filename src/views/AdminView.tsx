import { AppShell } from '../components/AppShell'
import { AppointmentList } from '../components/AppointmentList'
import { Badge, Card, EmptyState, ErrorBanner, Spinner } from '../components/ui'
import { F, OBJ } from '../knack/config'
import { bool, connectionLabel, email, formatDateTime, isUpcoming, name, phone, text } from '../knack/format'
import { useRecords } from '../knack/useRecords'

export function AdminView() {
  const appts = useRecords(OBJ.appointments, { rowsPerPage: 100, sortField: F.appt.date, sortOrder: 'desc' })
  const messages = useRecords(OBJ.messages, { rowsPerPage: 50, sortField: F.message.createdOn, sortOrder: 'desc' })
  const patients = useRecords(OBJ.patients, { rowsPerPage: 100 })
  const providers = useRecords(OBJ.providers, { rowsPerPage: 100 })

  const upcoming = appts.records.filter((r) => isUpcoming(r, F.appt.date))

  return (
    <AppShell title="Clinic overview" subtitle="Everything across the practice.">
      <div className="mb-8 grid gap-4 sm:grid-cols-5">
        <Stat label="Patients" value={patients.loading ? '—' : String(patients.total)} />
        <Stat label="Providers" value={providers.loading ? '—' : String(providers.total)} />
        <Stat label="Appointments" value={appts.loading ? '—' : String(appts.total)} />
        <Stat label="Upcoming" value={appts.loading ? '—' : String(upcoming.length)} />
        <Stat label="Messages" value={messages.loading ? '—' : String(messages.total)} />
      </div>

      {appts.error ? <div className="mb-6"><ErrorBanner error={appts.error} onRetry={appts.reload} /></div> : null}

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming appointments</h2>
          {appts.loading ? <Card><Spinner /></Card> : (
            <AppointmentList records={upcoming} showPatient emptyTitle="Nothing scheduled" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Patient messages</h2>
          {messages.loading ? <Card><Spinner /></Card> : messages.error ? (
            <Card className="p-4"><ErrorBanner error={messages.error} onRetry={messages.reload} /></Card>
          ) : messages.records.length === 0 ? (
            <Card><EmptyState title="No messages" body="Messages sent from the patient portal appear here." /></Card>
          ) : (
            <Card className="divide-y divide-slate-100">
              {messages.records.map((m) => {
                const status = text(m, F.message.status)
                return (
                  <div key={m.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{text(m, F.message.subject)}</p>
                      <Badge tone={status === 'Replied' ? 'green' : status === 'Read' ? 'blue' : 'amber'}>
                        {status === '—' ? 'New' : status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {connectionLabel(m, F.message.ownedBy)} · {formatDateTime(m, F.message.createdOn)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{text(m, F.message.body)}</p>
                  </div>
                )
              })}
            </Card>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Patients</h2>
            <Card className="divide-y divide-slate-100">
              {patients.loading ? <Spinner /> : patients.error ? <ErrorBanner error={patients.error} /> :
                patients.records.length === 0 ? <EmptyState title="No patients" /> :
                patients.records.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{name(p, F.patient.name)}</p>
                      <p className="truncate text-xs text-slate-500">{email(p, F.patient.email)} · {phone(p, F.patient.phone)}</p>
                    </div>
                    <Badge tone={bool(p, F.patient.active) ? 'green' : 'slate'}>
                      {bool(p, F.patient.active) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Providers</h2>
            <Card className="divide-y divide-slate-100">
              {providers.loading ? <Spinner /> : providers.error ? <ErrorBanner error={providers.error} /> :
                providers.records.length === 0 ? <EmptyState title="No providers" /> :
                providers.records.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{name(p, F.provider.name)}</p>
                      <p className="truncate text-xs text-slate-500">{text(p, F.provider.specialty)}</p>
                    </div>
                    <Badge tone={bool(p, F.provider.acceptingNew) ? 'green' : 'amber'}>
                      {bool(p, F.provider.acceptingNew) ? 'Accepting' : 'Closed'}
                    </Badge>
                  </div>
                ))}
            </Card>
          </section>
        </div>
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
