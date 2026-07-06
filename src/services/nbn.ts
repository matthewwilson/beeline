import { fetchJson } from './http'

const NBN_RECORDS = 'https://records-ws.nbnatlas.org/occurrences/search'

// Asian hornet (Vespa velutina) records within 10 km via NBN Atlas (keyless, CORS `*`).
// Returns the record count, or null if the check itself failed (so the UI can distinguish
// "no records found" from "couldn't check").
export async function fetchHornetCount(lat: number, lon: number): Promise<number | null> {
  const url = `${NBN_RECORDS}?q=Vespa%20velutina&lat=${lat}&lon=${lon}&radius=10&pageSize=5&facet=false`
  const data = await fetchJson<{ totalRecords?: number }>(url)
  if (!data) return null
  return data.totalRecords ?? 0
}
