import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { FORAGE, MAX_MARKERS, RING_KM } from '../data/forage'
import { POLLEN, pollenColour } from '../data/pollen'
import { escapeHtml, fmtDist } from '../lib/geo'
import { scoreOf } from '../lib/scoring'
import { useStore } from '../store/useStore'
import styles from './map.module.css'

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

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const layers = useRef<{ hive: L.LayerGroup; forage: L.LayerGroup; flower: L.LayerGroup; ring: L.LayerGroup } | null>(
    null,
  )

  const hives = useStore((s) => s.hives)
  const myHiveIds = useStore((s) => s.myHiveIds)
  const flowers = useStore((s) => s.flowers)
  const activeHive = useStore((s) => s.activeHive)
  const features = useStore((s) => s.features)
  const season = useStore((s) => s.season)
  const selectedPollen = useStore((s) => s.selectedPollen)
  const gddOffsetDays = useStore((s) => s.weather.gddOffsetDays)
  const flyRequest = useStore((s) => s.flyRequest)

  useEffect(() => {
    if (!containerRef.current) return
    const m = L.map(containerRef.current, { zoomControl: false }).setView([54.607, -5.926], 8)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)

    layers.current = {
      hive: L.layerGroup().addTo(m),
      forage: L.layerGroup().addTo(m),
      flower: L.layerGroup().addTo(m),
      ring: L.layerGroup().addTo(m),
    }

    m.on('click', (e: L.LeafletMouseEvent) => {
      const st = useStore.getState()
      if (st.placingFlower) {
        st.setPlacingFlower(false)
        st.setStatus('')
        st.requestFlowerAt(e.latlng.lat, e.latlng.lng)
        return
      }
      const name = window.prompt('Name this hive:', 'My hive')
      if (name === null) return
      st.addHive(e.latlng.lat, e.latlng.lng, name)
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
    for (const f of flowers) {
      const marker = L.marker([f.lat, f.lon], { icon: flowerIcon() })
      const note = f.note ? `<div class="pin-pop__meta">${escapeHtml(f.note)}</div>` : ''
      marker.bindPopup(
        `<div class="pin-pop__title">🌼 ${escapeHtml(f.plant)} <span class="pin-pop__badge">✓ you spotted</span></div>` +
          note +
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
  }, [map, flowers])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.ring
    group.clearLayers()
    if (!activeHive) return
    for (const km of [...RING_KM].reverse()) {
      L.circle([activeHive.lat, activeHive.lon], {
        radius: km * 1000,
        color: '#c47f00',
        weight: 1,
        opacity: 0.55,
        fillColor: '#f6a800',
        fillOpacity: km === 1 ? 0.1 : 0.04,
        dashArray: '4 5',
      })
        .addTo(group)
        .bindTooltip(`${km} km`)
    }
    map.flyTo([activeHive.lat, activeHive.lon], 13, { duration: 0.6 })
  }, [map, activeHive])

  useEffect(() => {
    if (!map || !layers.current) return
    const group = layers.current.forage
    group.clearLayers()
    const ctx = { season, gddOffsetDays, selectedPollen }
    const scored = features.map((f) => ({ ...f, score: scoreOf(f, ctx) })).sort((a, b) => b.score - a.score)
    const maxScore = scored.length ? scored[0].score : 1
    for (const f of scored.slice(0, MAX_MARKERS)) {
      if (f.confidence === 'observed') continue
      const meta = FORAGE[f.key]
      const matches = !selectedPollen || POLLEN[selectedPollen].keys.includes(f.key)
      const surveyed = f.confidence === 'surveyed'
      const marker = L.circleMarker([f.lat, f.lon], {
        radius: 5 + 7 * (f.score / maxScore),
        color: surveyed ? '#86c661' : 'rgba(243,231,204,0.85)',
        weight: surveyed ? 2 : 1,
        fillColor: meta.colour,
        fillOpacity: matches ? 0.9 : 0.15,
      })
      marker.bindPopup(
        `<div class="pin-pop__title">${escapeHtml(f.name)}${surveyed ? ' <span class="pin-pop__badge">✓ DAERA surveyed</span>' : ''}</div>` +
          `<div class="pin-pop__meta">${meta.label} · ${meta.plant}</div>` +
          `<div class="pin-pop__meta">${fmtDist(f.distance)} · ${f.dir}</div>` +
          `<div class="pin-pop__meta"><span class="pin-dot" style="background:${pollenColour(meta.pollen)}"></span>${meta.pollen} pollen</div>`,
      )
      marker.addTo(group)
    }
  }, [map, features, season, selectedPollen, gddOffsetDays])

  useEffect(() => {
    if (!map || !flyRequest) return
    map.flyTo([flyRequest.lat, flyRequest.lon], flyRequest.zoom, { duration: 0.6 })
  }, [map, flyRequest])

  return <div ref={containerRef} className={styles.root} />
}
