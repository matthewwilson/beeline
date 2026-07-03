import exifr from 'exifr'
import type { LatLon } from '../types'

export interface PhotoLocation extends LatLon {
  takenAt: Date | null
}

async function readTakenAt(file: File): Promise<Date | null> {
  try {
    const meta = await exifr.parse(file, ['DateTimeOriginal'])
    const value = meta?.DateTimeOriginal
    return value instanceof Date ? value : null
  } catch {
    return null
  }
}

export async function readPhotoLocation(file: File): Promise<PhotoLocation | null> {
  try {
    const gps = await exifr.gps(file)
    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) return null
    const takenAt = await readTakenAt(file)
    return { lat: gps.latitude, lon: gps.longitude, takenAt }
  } catch {
    return null
  }
}
