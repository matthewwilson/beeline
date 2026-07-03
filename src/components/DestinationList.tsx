import { useMemo } from 'react'
import { FORAGE } from '../data/forage'
import { POLLEN, pollenColour } from '../data/pollen'
import { fmtDist } from '../lib/geo'
import { scoreOf } from '../lib/scoring'
import { useStore } from '../store/useStore'
import styles from './results.module.css'

const EMPTY_COPY: Record<string, string> = {
  idle: 'Add a hive and select it to see where its bees forage.',
  scanning: 'Reading the landscape around this hive…',
  busy: 'The forage service is busy. Wait a moment, then select the hive again.',
  empty: 'No mapped forage nearby. Try a hive closer to farmland or a town.',
}

export function DestinationList() {
  const features = useStore((s) => s.features)
  const season = useStore((s) => s.season)
  const selectedPollen = useStore((s) => s.selectedPollen)
  const gddOffsetDays = useStore((s) => s.weather.gddOffsetDays)
  const forageStatus = useStore((s) => s.forageStatus)
  const flyTo = useStore((s) => s.flyTo)

  const rows = useMemo(() => {
    const ctx = { season, gddOffsetDays, selectedPollen }
    const scored = features.map((f) => ({ ...f, score: scoreOf(f, ctx) })).sort((a, b) => b.score - a.score)
    const max = scored.length ? scored[0].score : 1
    return scored.slice(0, 12).map((f) => ({ ...f, pct: Math.round((100 * f.score) / max) }))
  }, [features, season, selectedPollen, gddOffsetDays])

  if (forageStatus !== 'ready') return <p className={styles.empty}>{EMPTY_COPY[forageStatus]}</p>

  return (
    <ol className={styles.list}>
      {rows.map((f, i) => {
        const meta = FORAGE[f.key]
        const matches = !selectedPollen || POLLEN[selectedPollen].keys.includes(f.key)
        const tag = f.confidence === 'observed' ? 'you spotted' : f.confidence === 'surveyed' ? 'surveyed' : null
        return (
          <li key={`${f.lat},${f.lon},${i}`}>
            <button
              type="button"
              className={`${styles.dest} ${matches ? '' : styles.dim}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => flyTo(f.lat, f.lon, 15)}
            >
              <span className={styles.cell} style={{ background: pollenColour(meta.pollen) }} aria-hidden="true" />
              <span className={styles.destBody}>
                <span className={styles.destTop}>
                  <span className={styles.destName}>{f.name}</span>
                  <span className={styles.destPct}>{f.pct}%</span>
                </span>
                <span className={styles.destMeta}>
                  {meta.label} · {fmtDist(f.distance)} · {f.dir} · {meta.pollen} pollen
                  {tag && <span className={styles.destTag}> · {tag}</span>}
                </span>
                <span className={styles.fill}>
                  <span style={{ width: `${f.pct}%`, animationDelay: `${i * 40 + 100}ms` }} />
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
