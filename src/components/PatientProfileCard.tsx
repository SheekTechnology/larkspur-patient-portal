import { useState, type FormEvent } from 'react'
import { KnackApiError, updateRecord, type KnackRecord } from '../knack/api'
import { F, OBJ } from '../knack/config'
import { email as readEmail, formatDate, name as readName, phone as readPhone, raw, text, toNameWrite, toPhoneWrite } from '../knack/format'
import { Card, ErrorBanner } from './ui'

interface Props {
  record: KnackRecord
  /** Called after a successful save so the caller can refetch. */
  onSaved: () => void
}

/**
 * Lets a patient edit their own contact details.
 *
 * Data Access Control gives Patients edit rights on their own record only, so
 * this needs no ownership check: Knack rejects an attempt to write anyone
 * else's record with a 403.
 */
export function PatientProfileCard({ record, onSaved }: Props) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <Card className="p-4">
        <dl className="space-y-3 text-sm">
          <Row label="Name" value={readName(record, F.patient.name)} />
          <Row label="Email" value={readEmail(record, F.patient.email)} />
          <Row label="Phone" value={readPhone(record, F.patient.phone)} />
          <Row label="Date of birth" value={formatDate(record, F.patient.dob)} />
          <Row label="Insurance" value={text(record, F.patient.insurance)} />
          <Row label="Preferred contact" value={text(record, F.patient.contactMethod)} />
        </dl>
        <button
          onClick={() => setEditing(true)}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit your details
        </button>
      </Card>
    )
  }

  return <EditForm record={record} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved() }} />
}

function EditForm({ record, onCancel, onSaved }: { record: KnackRecord; onCancel: () => void; onSaved: () => void }) {
  const nameRaw = raw<{ full?: string; first?: string; last?: string }>(record, F.patient.name)
  const [fullName, setFullName] = useState(nameRaw?.full ?? [nameRaw?.first, nameRaw?.last].filter(Boolean).join(' ') ?? '')
  const [emailValue, setEmailValue] = useState(raw<{ email?: string }>(record, F.patient.email)?.email ?? '')
  const [phoneValue, setPhoneValue] = useState(readPhone(record, F.patient.phone) === '—' ? '' : readPhone(record, F.patient.phone))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) return setError(new Error('Please enter your name.'))
    if (!emailValue.trim()) return setError(new Error('Please enter your email address.'))

    setSaving(true)
    try {
      const fields: Record<string, unknown> = {
        [F.patient.name]: toNameWrite(fullName),
        [F.patient.email]: { email: emailValue.trim(), label: '' },
      }
      // Sending an empty phone would be rejected, so only include it when set.
      const phoneWrite = toPhoneWrite(phoneValue)
      if (phoneWrite) fields[F.patient.phone] = phoneWrite

      await updateRecord(OBJ.patients, record.id, fields)
      onSaved()
    } catch (e) {
      setError(e)
      setSaving(false)
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" id="p-name">
          <input
            id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
            autoComplete="name" className={inputClass}
          />
        </Field>

        <Field label="Email" id="p-email">
          <input
            id="p-email" type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)}
            autoComplete="email" className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This is the address you sign in with.
          </p>
        </Field>

        <Field label="Phone" id="p-phone">
          <input
            id="p-phone" type="tel" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)}
            autoComplete="tel" placeholder="(555) 123-4567" className={inputClass}
          />
        </Field>

        {error ? <ErrorBanner error={error} /> : null}

        <div className="flex gap-2 pt-1">
          <button
            type="submit" disabled={saving}
            className="flex-1 rounded-lg bg-larkspur-600 px-3 py-2 text-sm font-medium text-white hover:bg-larkspur-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button" onClick={onCancel} disabled={saving}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-larkspur-500 focus:ring-2 focus:ring-larkspur-200'

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
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

/** Surfaces the access-control case with a clearer message than the raw error. */
export function isAccessDenied(e: unknown): boolean {
  return e instanceof KnackApiError && e.isAccessControl
}
