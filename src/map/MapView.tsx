import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { FORAGE, MATING_RADIUS_KILOMETRES, MAX_MARKERS, RING_KILOMETRES } from '../data/forage'
import { POLLEN, pollenColour } from '../data/pollen'
import { createBees, stepBee } from '../lib/beeFlights'
import type { Bee } from '../lib/beeFlights'
import { confidenceDisplay, sourceDisplay } from '../lib/confidence'
import { confidenceForSource } from '../data/sources'
import { cellFactorRows, DEFAULT_STEP_METRES } from '../lib/droneCongregationArea'
import { clamp, escapeMarkup, formatDistance, offsetLatLon } from '../lib/geo'
import { useScoredFeatures } from '../lib/useScoredFeatures'
import { flightAvailabilityFactor, flyVerdict } from '../lib/weather'
import { useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import type { LatLon } from '../types'
import styles from './map.module.css'

const MAX_FRAME_MS = 48

function beeIcon(mine: boolean, active: boolean): L.DivIcon {
  const cls = ['bee-pin', mine && 'bee-pin--mine', active && 'bee-pin--active'].filter(Boolean).join(' ')
  const size = mine ? 30 : 26
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">🐝</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function flowerIcon(): L.DivIcon {
  return L.divIcon({ className: '', html: '<div class="flower-pin">🌼</div>', iconSize: [22, 22], iconAnchor: [11, 11] })
}

function flyIcon(colour: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span class="bee-fly" style="color:${colour}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

// Warm suitability ramp: amber (lower) → deep red (higher). t is 0..1.
function droneCongregationAreaColour(t: number): string {
  return `hsl(${45 - 33 * t}, 85%, ${56 - 10 * t}%)`
}

function drawStaticFlights(group: L.LayerGroup, bees: Bee[], hive: LatLon): void {
  for (const bee of bees) {
    if (bee.band === 'orientation') {
      L.circle([hive.lat, hive.lon], {
        radius: bee.loopRadius,
        color: bee.colour,
        weight: 1,
        opacity: 0.6,
        fill: false,
        dashArray: '3 5',
      }).addTo(group)
      continue
    }
    L.polyline([[hive.lat, hive.lon], [bee.dest.lat, bee.dest.lon]], {
      color: bee.colour,
      weight: 1,
      opacity: 0.55,
      dashArray: '4 6',
    }).addTo(group)
    L.circleMarker([bee.dest.lat, bee.dest.lon], {
      radius: 3,
      color: bee.colour,
      fillColor: bee.colour,
      fillOpacity: 0.85,
      weight: 1,
    }).addTo(group)
  }
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const layers = useRef<{
    droneCongregationArea: L.LayerGroup
    hive: L.LayerGroup
    forage: L.LayerGroup
    flower: L.LayerGroup
    ring: L.LayerGroup
    mating: L.LayerGroup
    bee: L.LayerGroup
  } | null>(null)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const hives = useStore((s) => s.hives)
  const myHiveIds = useStore((s) => s.myHiveIds)
  const flowers = useStore((s) => s.flowers)
  const activeHive = useStore((s) => s.activeHive)
  const selectedPollen = useStore((s) => s.selectedPollen)
  const showConfidenceLayer = useStore((s) => s.showConfidenceLayer)
  const showBeeFlights = useStore((s) => s.showBeeFlights)
  const showMatingRadius = useStore((s) => s.showMatingRadius)
  const showDroneCongregationArea = useStore((s) => s.showDroneCongregationArea)
  const droneCongregationAreaCells = useStore((s) => s.droneCongregationAreaCells)
  const droneCongregationAreaStatus = useStore((s) => s.droneCongregationAreaStatus)
  const currentWeather = useStore((s) => s.weather.current)
  const flyRequest = useUiStore((s) => s.flyRequest)
  const scored = useScoredFeatures()

  useEffect(() => {
    if (!containerRef.current) return
    const m = L.map(containerRef.current, { zoomControl: false })
    m.fitBounds([[49.8, -11], [60.9, 2]], { padding: [18, 18] })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)

    layers.current = {
      // The drone congregation area grid sits under everything else so markers and rings stay legible.
      droneCongregationArea: L.layerGroup().addTo(m),
      hive: L.layerGroup().addTo(m),
      forage: L.layerGroup().addTo(m),
      flower: L.layerGroup().addTo(m),
      ring: L.layerGroup().addTo(m),
      mating: L.layerGroup().addTo(m),
      bee: L.layerGroup().addTo(m),
    }

    m.on('click', (e: L.LeafletMouseEvent) => {
      const st = useStore.getState()
      if (st.placingFlower) {
        st.setPlacingFlower(false)
        st.setStatus('')
        st.requestFlowerAt(e.latlng.lat, e.latlng.lng)
        return
      }
      // Opens the HiveNamePicker modal; naming + navigation happen there.
      st.requestHiveAt(e.latlng.lat, e.latlng.lng)
    })

    setMap(m)
    return () => {
      m.remove()
      layers.current = null
      setMap(null)
    }
  }, [])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.hive
    group.clearLayers()
    for (const h of hives) {
      const mine = myHiveIds.includes(h.id)
      const active = activeHive?.id === h.id
      const marker = L.marker([h.lat, h.lon], { icon: beeIcon(mine, active), title: h.name })
      marker.bindTooltip(mine ? `${h.name} · your hive` : h.name, { direction: 'top', offset: [0, -16] })
      marker.on('click', () => useStore.getState().selectHive(h))
      marker.addTo(group)
    }
  }, [map, hives, myHiveIds, activeHive])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.flower
    group.clearLayers()
    if (!activeHive) return
    const observedConfidence = confidenceDisplay('observed')
    for (const f of flowers) {
      if (showConfidenceLayer) {
        L.circleMarker([f.lat, f.lon], {
          radius: 15,
          color: '#f7d26a',
          weight: 2,
          fill: false,
          opacity: 0.9,
        }).addTo(group)
      }
      const marker = L.marker([f.lat, f.lon], { icon: flowerIcon() })
      const note = f.note ? `<div class="pin-pop__meta">${escapeMarkup(f.note)}</div>` : ''
      marker.bindPopup(
        `<div class="pin-pop__title">🌼 ${escapeMarkup(f.plant)} <span class="pin-pop__badge">✓ you spotted</span></div>` +
          note +
          `<div class="pin-pop__meta">${observedConfidence.label} · ${observedConfidence.detail}</div>` +
          `<button class="pin-remove" data-flower="${f.id}">Remove</button>`,
      )
      marker.on('popupopen', (e) => {
        const btn = e.popup.getElement()?.querySelector('[data-flower]')
        btn?.addEventListener('click', () => {
          map.closePopup()
          useStore.getState().removeFlower(f.id)
        })
      })
      marker.addTo(group)
    }
  }, [map, flowers, activeHive, showConfidenceLayer])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.ring
    group.clearLayers()
    if (!activeHive || showMatingRadius) return
    for (const kilometres of [...RING_KILOMETRES].reverse()) {
      L.circle([activeHive.lat, activeHive.lon], {
        radius: kilometres * 1000,
        color: '#c47f00',
        weight: 1,
        opacity: 0.55,
        fillColor: '#f6a800',
        fillOpacity: kilometres === 1 ? 0.1 : 0.04,
        dashArray: '4 5',
      })
        .addTo(group)
        .bindTooltip(`${kilometres} km`)
    }
    map.flyTo([activeHive.lat, activeHive.lon], 13, { duration: 0.6 })
  }, [map, activeHive, showMatingRadius])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.mating
    group.clearLayers()
    if (!activeHive || !showMatingRadius) return
    L.circle([activeHive.lat, activeHive.lon], {
      radius: MATING_RADIUS_KILOMETRES * 1000,
      color: '#8b5cf6',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#8b5cf6',
      fillOpacity: 0.06,
      dashArray: '4 5',
    })
      .addTo(group)
      .bindTooltip(`Queen mating range · ~${MATING_RADIUS_KILOMETRES} km`)
    map.flyTo([activeHive.lat, activeHive.lon], 12, { duration: 0.6 })
  }, [map, activeHive, showMatingRadius])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.forage
    group.clearLayers()
    const maxScore = scored.length ? scored[0].score : 1
    const flightClass = flyVerdict(currentWeather).cls
    const availability = flightAvailabilityFactor(flightClass)
    for (const f of scored.slice(0, MAX_MARKERS)) {
      const confidenceKey = confidenceForSource(f.source)
      if (confidenceKey === 'observed') continue
      const meta = FORAGE[f.key]
      const matches = !selectedPollen || POLLEN[selectedPollen].keys.includes(f.key)
      const surveyed = confidenceKey === 'surveyed'
      const confidence = confidenceDisplay(confidenceKey)
      const source = sourceDisplay(f.source)
      const confidenceLayerStyle = showConfidenceLayer
        ? {
            color: surveyed ? '#86c661' : 'rgba(243,231,204,0.85)',
            weight: surveyed ? 2.5 : 1.5,
            dashArray: surveyed ? undefined : '3 5',
            opacity: surveyed ? 0.95 : 0.75,
          }
        : {
            color: surveyed ? '#86c661' : 'rgba(243,231,204,0.85)',
            weight: surveyed ? 2 : 1,
            dashArray: undefined,
            opacity: 1,
          }
      const weatherMeta =
        flightClass === 'bad'
          ? '<div class="pin-pop__meta">Flight constrained now — forage exists, but bees are likely grounded.</div>'
          : flightClass === 'marg'
            ? '<div class="pin-pop__meta">Marginal flight weather now — access is reduced.</div>'
            : ''
      const marker = L.circleMarker([f.lat, f.lon], {
        radius: (5 + 7 * (f.score / maxScore)) * (0.75 + 0.25 * availability),
        ...confidenceLayerStyle,
        fillColor: meta.colour,
        fillOpacity: matches ? 0.18 + 0.72 * availability : 0.15,
      })
      marker.bindPopup(
        `<div class="pin-pop__title">${escapeMarkup(f.name)}${surveyed ? ` <span class="pin-pop__badge">✓ ${escapeMarkup(source.label)}</span>` : ''}</div>` +
          `<div class="pin-pop__meta">${meta.label} · ${meta.plant}</div>` +
          `<div class="pin-pop__meta">${formatDistance(f.distance)} · ${f.dir}</div>` +
          `<div class="pin-pop__meta"><span class="pin-dot" style="background:${pollenColour(meta.pollen)}"></span>${meta.pollen} pollen</div>` +
          `<div class="pin-pop__meta">${confidence.label} · ${escapeMarkup(source.detail)}</div>` +
          weatherMeta,
      )
      marker.addTo(group)
    }
  }, [map, scored, selectedPollen, showConfidenceLayer, currentWeather])

  // Drone-congregation-area suitability grid: draw the stronger cells as graded, warm squares.
  // Each carries a popup breaking down why it scored as it did; click an empty area (or toggle
  // the layer off) to drop a hive instead.
  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.droneCongregationArea
    group.clearLayers()
    if (!showDroneCongregationArea || droneCongregationAreaCells.length === 0) return
    const haveElev = droneCongregationAreaStatus === 'ready' || droneCongregationAreaStatus === 'partial-land-cover'
    const half = DEFAULT_STEP_METRES / 2
    for (const cell of droneCongregationAreaCells) {
      if (cell.score < 0.35) continue // hide low absolute suitability to keep the map honest and readable
      const k = clamp((cell.score - 0.35) / 0.65, 0, 1)
      const sw = offsetLatLon(cell, -half, -half)
      const ne = offsetLatLon(cell, half, half)
      const rows = cellFactorRows(cell, haveElev)
        .map((r) => `<div class="pin-pop__meta">${r.label} · ${r.pct}%</div>`)
        .join('')
      const missingData =
        droneCongregationAreaStatus === 'partial-elevation'
          ? '<div class="pin-pop__meta">No elevation data — land cover only.</div>'
          : droneCongregationAreaStatus === 'partial-land-cover'
            ? '<div class="pin-pop__meta">No land-cover data — terrain only.</div>'
            : droneCongregationAreaStatus === 'partial'
              ? '<div class="pin-pop__meta">Live landscape data incomplete.</div>'
              : ''
      L.rectangle([[sw.lat, sw.lon], [ne.lat, ne.lon]], {
        stroke: false,
        fillColor: droneCongregationAreaColour(k),
        fillOpacity: 0.18 + 0.42 * k,
      })
        .bindPopup(
          `<div class="pin-pop__title">🐝 Drone gathering · ${Math.round(cell.score * 100)}% model score</div>` +
            rows +
            missingData,
        )
        .addTo(group)
    }
  }, [map, showDroneCongregationArea, droneCongregationAreaCells, droneCongregationAreaStatus])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.bee
    group.clearLayers()
    if (!showBeeFlights || !activeHive) return

    const hive: LatLon = { lat: activeHive.lat, lon: activeHive.lon }
    const bees = createBees(scored, hive)

    if (reducedMotion) {
      drawStaticFlights(group, bees, hive)
      return
    }

    const markers = bees.map((bee) => {
      const marker = L.marker([hive.lat, hive.lon], {
        icon: flyIcon(bee.colour),
        interactive: false,
        keyboard: false,
      })
      marker.addTo(group)
      return marker
    })

    let frame = 0
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(MAX_FRAME_MS, now - prev)
      prev = now
      for (let i = 0; i < bees.length; i++) {
        const p = stepBee(bees[i], dt, hive, scored)
        markers[i].setLatLng([p.lat, p.lon])
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      group.clearLayers()
    }
  }, [map, showBeeFlights, activeHive, scored, reducedMotion])

  useEffect(() => {
    if (!map || !flyRequest) return
    map.flyTo([flyRequest.lat, flyRequest.lon], flyRequest.zoom, { duration: 0.6 })
  }, [map, flyRequest])

  // The map's container height changes when the mobile Map tab shrinks it to sit
  // above the weather/legend panel; keep Leaflet's tile layout in sync.
  useEffect(() => {
    const el = containerRef.current
    if (!map || !el) return
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])

  return <div ref={containerRef} className={styles.root} />
}
