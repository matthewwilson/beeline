export const NBN_RECORDS = 'https://records-ws.nbnatlas.org/occurrences/search'

// Asian hornet (Vespa velutina) records within 10 km via NBN Atlas (keyless, CORS `*`).
// Returns the record count, or null if the check itself failed.
export async function fetchHornetCount(lat: number, lon: number): Promise<number | null> {
  try {
    const url = `${NBN_RECORDS}?q=Vespa%20velutina&lat=${lat}&lon=${lon}&radius=10&pageSize=5&facet=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    return data.totalRecords ?? 0
  } catch {
    return null
  }
}
