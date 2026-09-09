/** Helpers for Knack's `_raw` field shapes. Always read `_raw`, never the formatted HTML. */

export function raw<T = any>(record: Record<string, any>, fieldKey: string): T | undefined {
  return record[`${fieldKey}_raw`] as T | undefined
}

export function text(record: Record<string, any>, fieldKey: string): string {
  const v = raw(record, fieldKey)
  if (v == null || v === '') return '—'
  // Compound fields (name, phone, email, date...) are objects. Stringifying one
  // yields "[object Object]" on screen, so route callers to the right helper
  // instead of silently rendering junk.
  if (typeof v === 'object') {
    const o = v as Record<string, any>
    const candidate = o.full ?? o.formatted ?? o.email ?? o.identifier ?? o.label
    return typeof candidate === 'string' && candidate ? candidate : '—'
  }
  return String(v)
}

export function name(record: Record<string, any>, fieldKey: string): string {
  const v = raw<{ full?: string; first?: string; last?: string }>(record, fieldKey)
  if (!v) return '—'
  return v.full ?? [v.first, v.last].filter(Boolean).join(' ') ?? '—'
}

export function email(record: Record<string, any>, fieldKey: string): string {
  return raw<{ email?: string }>(record, fieldKey)?.email ?? '—'
}

export function phone(record: Record<string, any>, fieldKey: string): string {
  const v = raw<any>(record, fieldKey)
  if (!v) return '—'
  if (typeof v === 'string') return v || '—'
  for (const k of ['formatted', 'full', 'number'] as const) {
    if (typeof v[k] === 'string' && v[k]) {
      return k === 'number' && v.area ? `(${v.area}) ${v.number}` : v[k]
    }
  }
  return '—'
}

export function bool(record: Record<string, any>, fieldKey: string): boolean {
  return raw<boolean>(record, fieldKey) === true
}

/** Connection fields come back as an array of { id, identifier }. */
export function connection(record: Record<string, any>, fieldKey: string): { id: string; identifier: string } | null {
  const v = raw<Array<{ id: string; identifier: string }>>(record, fieldKey)
  return v && v.length > 0 ? v[0] : null
}

export function connectionLabel(record: Record<string, any>, fieldKey: string): string {
  return connection(record, fieldKey)?.identifier ?? '—'
}

interface KnackDate {
  iso_timestamp?: string
  unix_timestamp?: number
  date?: string
}

export function dateOf(record: Record<string, any>, fieldKey: string): Date | null {
  const v = raw<KnackDate>(record, fieldKey)
  if (!v) return null
  if (v.iso_timestamp) return new Date(v.iso_timestamp)
  if (typeof v.unix_timestamp === 'number') return new Date(v.unix_timestamp)
  if (v.date) return new Date(v.date)
  return null
}

export function formatDateTime(record: Record<string, any>, fieldKey: string): string {
  const d = dateOf(record, fieldKey)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function formatDate(record: Record<string, any>, fieldKey: string): string {
  const d = dateOf(record, fieldKey)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isUpcoming(record: Record<string, any>, fieldKey: string): boolean {
  const d = dateOf(record, fieldKey)
  return !!d && d.getTime() >= Date.now()
}

export function statusTone(status: string): 'green' | 'amber' | 'red' | 'slate' | 'blue' {
  const s = status.toLowerCase()
  if (s.includes('complete')) return 'green'
  if (s.includes('cancel') || s.includes('no show') || s.includes('no-show')) return 'red'
  if (s.includes('pending') || s.includes('schedul')) return 'blue'
  if (s.includes('confirm')) return 'green'
  return 'slate'
}

/**
 * Knack's write format for a phone field.
 *
 * The field's format is "(999) 999-9999" with no extension, meaning one
 * ten-digit value rather than a broken-out area code. Splitting into
 * { area, number } does not match that format and blanks the field.
 */
export function toPhoneWrite(input: string): { number: string } | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return { number: national }
}

/** Splits a display name into Knack's write format. */
export function toNameWrite(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}
