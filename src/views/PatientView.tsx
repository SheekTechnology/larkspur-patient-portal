import { AppShell } from '../components/AppShell'
import { AppointmentList } from '../components/AppointmentList'
import { Card, EmptyState, ErrorBanner, Spinner } from '../components/ui'
import { F, OBJ } from '../knack/config'
import { formatDate, formatDateTime, isUpcoming, text } from '../knack/format'
import { useRecords } from '../knack/useRecords'
import { useSession } from '../knack/session'

/**
 * Patients see only their own records. There is deliberately no user-ID filter here —
 * Knack's Data Access Control scopes every response server-side.
 */
export function PatientView() {
  const { user } = useSession()

  const appts = useRecords(OBJ.appointments, {
    rowsPerPage: 100,
    sortField: F.appt.date,
    sortOrder: 'desc',
  })
  const docs = useRecords(OBJ.documents, {
    rowsPerPage: 50,
    sortField: F.doc.uploadedOn,
    sortOrder: 'desc',
  })
  const me = useRecords(OBJ.patients, { rowsPerPage: 1 })

  const upcoming = appts.records.filter((r) => isUpcoming(r, F.appt.date))
  const past = appts.records.filter((r) => !isUpcoming(r, F.appt.date))
  const profile = me.records[0]

  return (
    <AppShell title={`Welcome, ${user?.fullName ?? ''}`} subtitle="Your appointments, documents and details.">
      {appts.error ? <div className="mb-6"><ErrorBanner error={appts.error} onRetry={appts.reload} /></div> : null}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming</h2>
            {appts.loading ? <Card><Spinner /></Card> : (
              <AppointmentList
                records={upcoming}
                emptyTitle="No upcoming appointments"
                emptyBody="When your clinic schedules a visit, it will appear here."
              />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Past visits</h2>
            {appts.loading ? <Card><Spinner /></Card> : (
              <AppointmentList records={past} emptyTitle="No past visits" />
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your details</h2>
            <Card className="p-4">
              {me.loading ? <Spinner /> : me.error ? <ErrorBanner error={me.error} /> : profile ? (
                <dl className="space-y-3 text-sm">
                  <Row label="Date of birth" value={formatDate(profile, F.patient.dob)} />
                  <Row label="Phone" value={text(profile, F.patient.phone)} />
                  <Row label="Insurance" value={text(profile, F.patient.insurance)} />
                  <Row label="Preferred contact" value={text(profile, F.patient.contactMethod)} />
                </dl>
              ) : (
                <EmptyState
                  title="No patient record linked"
                  body="Your sign-in worked, but no Patients record is connected to this account."
                />
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Documents</h2>
            {docs.loading ? <Card><Spinner /></Card> : docs.error ? <ErrorBanner error={docs.error} /> : (
              <Card className="divide-y divide-slate-100">
                {docs.records.length === 0 ? (
                  <EmptyState title="No documents" body="Files shared by your clinic will appear here." />
                ) : docs.records.map((d) => (
                  <div key={d.id} className="p-4">
                    <p className="text-sm font-medium">{text(d, F.doc.title)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {text(d, F.doc.docType)} · {formatDateTime(d, F.doc.uploadedOn)}
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
