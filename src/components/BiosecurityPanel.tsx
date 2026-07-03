import { useStore } from '../store/useStore'
import styles from './results.module.css'

export function BiosecurityPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const { loading, hornetCount, failed } = useStore((s) => s.biosecurity)
  if (!activeHive) return null

  return (
    <details className={styles.block}>
      <summary className={styles.summary}>Biosecurity &amp; alerts</summary>

      {loading && <p className={styles.bio}>Checking for Asian hornet records nearby…</p>}
      {!loading && failed && <p className={styles.bio}>Couldn’t check Asian hornet records right now.</p>}
      {!loading && !failed && hornetCount === 0 && (
        <p className={styles.bio}>
          <span className={styles.ok}>No confirmed Asian hornet records within 10 km</span> (NBN Atlas).
        </p>
      )}
      {!loading && !failed && hornetCount != null && hornetCount > 0 && (
        <p className={styles.bio}>
          <span className={styles.warn}>
            {hornetCount} Asian hornet record{hornetCount === 1 ? '' : 's'} within 10 km
          </span>{' '}
          (NBN Atlas) — stay vigilant.
        </p>
      )}

      <p className={styles.bio}>
        First NI Asian hornet nest was confirmed in Belfast (Oct 2025). Seen one?{' '}
        <a href="https://www.invasivespeciesni.co.uk/how-to-report" target="_blank" rel="noopener">
          Report it
        </a>
        , use the Asian Hornet Watch app, or email{' '}
        <a href="mailto:alertnonnative@ceh.ac.uk">alertnonnative@ceh.ac.uk</a>.
      </p>
      <p className={styles.bio}>
        Suspect foulbrood (AFB/EFB) or unusual colony loss? In NI, bee health is handled by{' '}
        <a href="https://www.daera-ni.gov.uk/articles/bee-health" target="_blank" rel="noopener">
          DAERA
        </a>
        , not the GB National Bee Unit. Notifiable disease must be reported to DAERA.
      </p>
    </details>
  )
}
