import { useCallback, useEffect, useState } from 'react'
import { listRecords, type KnackRecord, type ListOptions } from './api'

interface State<T> {
  records: T[]
  total: number
  loading: boolean
  error: unknown
  reload: () => void
}

/**
 * Fetches a page of records once, on mount. No polling — Knack's guidance is that
 * every request is triggered by a user action or a lifecycle event.
 */
export function useRecords<T = KnackRecord>(objectKey: string | null, opts: ListOptions = {}): State<T> {
  const [records, setRecords] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)

  const key = JSON.stringify({ objectKey, opts })

  useEffect(() => {
    if (!objectKey) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    listRecords<T>(objectKey, opts)
      .then((page) => {
        if (cancelled) return
        setRecords(page.records)
        setTotal(page.total_records)
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { records, total, loading, error, reload }
}
