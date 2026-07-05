interface FetchJsonOptions {
  timeoutMs?: number
  init?: RequestInit
}

/**
 * Fetch JSON and fail soft: returns null on any network error, non-2xx status, timeout or
 * malformed body, never throwing to the caller. Services layer their typed result on top,
 * so a failed call is always distinguishable from an empty-but-successful one (null vs []).
 */
export async function fetchJson<T = unknown>(url: string, options: FetchJsonOptions = {}): Promise<T | null> {
  const { timeoutMs = 12000, init } = options
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
