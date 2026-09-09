import { useState, type FormEvent } from 'react'
import { createRecord } from '../knack/api'
import { F, OBJ } from '../knack/config'
import { formatDateTime, text } from '../knack/format'
import { useRecords } from '../knack/useRecords'
import { useSession } from '../knack/session'
import { Badge, Card, EmptyState, ErrorBanner, Spinner } from './ui'

/**
 * Patient messaging.
 *
 * Messages carry no connection field to the patient. Knack stamps Owned By from
 * the bearer token on create, and Data Access Control scopes reads to owned
 * records, so a patient sees only their own without any filter here.
 */
export function PatientMessages() {
  const messages = useRecords(OBJ.messages, {
    rowsPerPage: 50,
    sortField: F.message.createdOn,
    sortOrder: 'desc',
  })
  const [composing, setComposing] = useState(false)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Messages</h2>
        {!composing && (
          <button
            onClick={() => setComposing(true)}
            className="rounded-lg bg-larkspur-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-larkspur-700"
          >
            New message
          </button>
        )}
      </div>

      {composing && (
        <div className="mb-4">
          <Compose
            onCancel={() => setComposing(false)}
            onSent={() => { setComposing(false); messages.reload() }}
          />
        </div>
      )}

      {messages.loading ? (
        <Card><Spinner label="Loading your messages…" /></Card>
      ) : messages.error ? (
        <Card className="p-4"><ErrorBanner error={messages.error} onRetry={messages.reload} /></Card>
      ) : messages.records.length === 0 ? (
        <Card>
          <EmptyState
            title="No messages yet"
            body="Send a message and the Larkspur team will get back to you."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {messages.records.map((m) => {
            const status = text(m, F.message.status)
            return (
              <div key={m.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{text(m, F.message.subject)}</p>
                  <Badge tone={status === 'Replied' ? 'green' : status === 'Read' ? 'blue' : 'slate'}>
                    {status === '—' ? 'Sent' : status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(m, F.message.createdOn)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{text(m, F.message.body)}</p>
              </div>
            )
          })}
        </Card>
      )}
    </section>
  )
}

function Compose({ onCancel, onSent }: { onCancel: () => void; onSent: () => void }) {
  const { user } = useSession()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!subject.trim()) return setError(new Error('Please add a subject.'))
    if (!body.trim()) return setError(new Error('Please write your message.'))

    setSending(true)
    try {
      const fields: Record<string, unknown> = {
        [F.message.subject]: subject.trim(),
        [F.message.body]: body.trim(),
        // Must match a Status option exactly. Matching is case-sensitive.
        [F.message.status]: 'New',
      }

      // The Patient connection points at the Patients role record, not the
      // account. Using session.user.id here would link nothing.
      const patientRecordId = user?.roleRecordIds['profile_4']
      if (patientRecordId) fields[F.message.patient] = [{ id: patientRecordId }]

      await createRecord(OBJ.messages, fields)
      onSent()
    } catch (e) {
      setError(e)
      setSending(false)
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="m-subject" className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
          <input
            id="m-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Prescription refill" className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="m-body" className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
          <textarea
            id="m-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5}
            placeholder="How can the Larkspur team help?" className={inputClass}
          />
        </div>

        {error ? <ErrorBanner error={error} /> : null}

        <div className="flex gap-2">
          <button
            type="submit" disabled={sending}
            className="rounded-lg bg-larkspur-600 px-4 py-2 text-sm font-medium text-white hover:bg-larkspur-700 disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send message'}
          </button>
          <button
            type="button" onClick={onCancel} disabled={sending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Only you and the Larkspur team can see your messages. For anything urgent, call the clinic.
        </p>
      </form>
    </Card>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-larkspur-500 focus:ring-2 focus:ring-larkspur-200'
