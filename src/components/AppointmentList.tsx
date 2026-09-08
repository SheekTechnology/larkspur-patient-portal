import { F } from '../knack/config'
import type { KnackRecord } from '../knack/api'
import { connectionLabel, formatDateTime, statusTone, text } from '../knack/format'
import { Badge, Card, EmptyState } from './ui'

export function AppointmentList({
  records,
  showPatient = false,
  showProvider = true,
  emptyTitle = 'No appointments',
  emptyBody,
}: {
  records: KnackRecord[]
  showPatient?: boolean
  showProvider?: boolean
  emptyTitle?: string
  emptyBody?: string
}) {
  if (records.length === 0) return <Card><EmptyState title={emptyTitle} body={emptyBody} /></Card>

  return (
    <Card className="divide-y divide-slate-100">
      {records.map((r) => {
        const status = text(r, F.appt.status)
        return (
          <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{formatDateTime(r, F.appt.date)}</p>
                <Badge tone={statusTone(status)}>{status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {text(r, F.appt.visitType)}
                {showProvider && <> · {connectionLabel(r, F.appt.provider)}</>}
                {showPatient && <> · {connectionLabel(r, F.appt.patient)}</>}
              </p>
              {text(r, F.appt.notes) !== '—' && (
                <p className="mt-2 max-w-2xl text-sm text-slate-500">{text(r, F.appt.notes)}</p>
              )}
            </div>
            <p className="shrink-0 text-sm text-slate-500">{text(r, F.appt.durationMins)} min</p>
          </div>
        )
      })}
    </Card>
  )
}
