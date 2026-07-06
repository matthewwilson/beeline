import { useMemo } from 'react'
import { MONTHS } from '../data/bloom'
import { forageCalendar } from '../lib/calendar'
import { useStore } from '../store/useStore'
import styles from './results.module.css'

export function ForageCalendar() {
  const features = useStore((s) => s.features)
  const cal = useMemo(() => forageCalendar(features), [features])
  if (!cal) return null

  const { monthly, peak, nowMonth, gapMonth, isGap, isJune, suggestions, autumnGapMonth, isAutumnGap, autumnSuggestions } =
    cal

  return (
    <details className={styles.block} open>
      <summary className={styles.summary}>Forage calendar &amp; gaps</summary>
      <div className={styles.cal}>
        {monthly.map((v, m) => {
          const height = Math.round((100 * v) / peak)
          const gap = (m === gapMonth && isGap) || (m === autumnGapMonth && isAutumnGap)
          const cls = [styles.mo, gap ? styles.moGap : '', m === nowMonth ? styles.moNow : '']
            .filter(Boolean)
            .join(' ')
          return (
            <div key={m} className={cls} title={MONTHS[m]}>
              <span className={styles.bar} style={{ height: `${height}%` }} />
              <span className={styles.moLab}>{MONTHS[m][0]}</span>
            </div>
          )
        })}
      </div>
      {isGap ? (
        <p className={styles.callout}>
          Forage dips in <b>{MONTHS[gapMonth]}</b>
          {isJune ? ' — the classic June gap' : ''}.
          {suggestions.length > 0 ? ` Plant to fill it: ${suggestions.join(', ')}.` : ''}
        </p>
      ) : (
        <p className={styles.callout}>Fairly steady forage through the season near this hive — no severe gap.</p>
      )}
      {isAutumnGap && (
        <p className={styles.callout}>
          Forage tails off by <b>{MONTHS[autumnGapMonth]}</b> — the autumn dearth.
          {autumnSuggestions.length > 0 ? ` Plant to fill it: ${autumnSuggestions.join(', ')}.` : ''}
        </p>
      )}
      <p className={`hint ${styles.calHint}`}>
        Relative nectar and pollen by month, from nearby sources and their bloom windows.
      </p>
    </details>
  )
}
