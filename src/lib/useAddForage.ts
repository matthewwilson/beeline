import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { readPhotoLocation } from './photo'
import { useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'

export const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, timeout: 8000 }

function foundMessage(takenAt: Date | null): string {
  if (!takenAt) return 'Found the photo location. Choose what was flowering.'
  const date = takenAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `Found the photo location from ${date}. Choose what was flowering.`
}

/**
 * Shared "add a hive / flower / flower from photo" actions, used by both the
 * desktop Setup panel and the mobile map add menu. Owns its own hidden file
 * input ref so each caller wires up one <input> via `photoInput`.
 */
export function useAddForage() {
  const requestFlowerAt = useStore((s) => s.requestFlowerAt)
  const requestHiveAt = useStore((s) => s.requestHiveAt)
  const setPlacingFlower = useStore((s) => s.setPlacingFlower)
  const setStatus = useStore((s) => s.setStatus)
  const setMobileView = useUiStore((s) => s.setMobileView)
  const photoInput = useRef<HTMLInputElement>(null)

  // Placing a flower means tapping the map, so bring the map into view first.
  const startPlacingFlower = (): void => {
    setPlacingFlower(true)
    setMobileView('map')
  }

  const addHiveHere = () => {
    if (!navigator.geolocation) {
      setStatus('Location unavailable — tap the map to place a hive.')
      return
    }
    setStatus('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('')
        // Opens the HiveNamePicker modal; naming + navigation happen there.
        requestHiveAt(pos.coords.latitude, pos.coords.longitude)
      },
      () => setStatus('Location denied — tap the map to place your hive.'),
      GEO_OPTS,
    )
  }

  const addFlower = () => {
    if (!navigator.geolocation) {
      startPlacingFlower()
      setStatus('Tap the map where the flower is.')
      return
    }
    setStatus('Finding where you’re standing…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('')
        requestFlowerAt(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        startPlacingFlower()
        setStatus('Location denied — tap the map where the flower is.')
      },
      GEO_OPTS,
    )
  }

  const pickPhoto = () => photoInput.current?.click()

  const onPhotoChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setStatus('Reading the photo…')
    const location = await readPhotoLocation(file)
    if (!location) {
      setStatus('No location saved in that photo. Add the flower by tapping the map instead.')
      return
    }
    requestFlowerAt(location.lat, location.lon)
    setStatus(foundMessage(location.takenAt))
  }

  return { photoInput, addHiveHere, addFlower, pickPhoto, onPhotoChosen }
}
