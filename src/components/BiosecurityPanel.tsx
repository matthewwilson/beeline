import { useStore } from '../store/useStore'
import { JURISDICTION_PROFILES } from '../data/jurisdictionProfiles'
import styles from './results.module.css'

export function BiosecurityPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const jurisdiction = useStore((s) => s.activeJurisdiction)
  const { loading, hornetCount, provider, failed } = useStore((s) => s.biosecurity)
  if (!activeHive || !jurisdiction || jurisdiction === 'unsupported') return null
  const profile = JURISDICTION_PROFILES[jurisdiction]

  return (
    <details className={styles.block}>
      <summary className={styles.summary}>Biosecurity &amp; alerts</summary>

      {loading && <p className={styles.bio}>Checking for yellow-legged hornet records nearby…</p>}
      {!loading && failed && <p className={styles.bio}>Couldn’t check yellow-legged hornet records right now.</p>}
      {!loading && !failed && hornetCount === 0 && (
        <p className={styles.bio}>
          <span className={styles.ok}>No published yellow-legged hornet records within 10 km</span> ({provider}).
        </p>
      )}
      {!loading && !failed && hornetCount != null && hornetCount > 0 && (
        <p className={styles.bio}>
          <span className={styles.warn}>
            {hornetCount} yellow-legged hornet record{hornetCount === 1 ? '' : 's'} within 10 km
          </span>{' '}
          ({provider}) — stay vigilant.
        </p>
      )}

      <p className={styles.bio}>
        Seen a suspected yellow-legged hornet (Asian hornet)?{' '}
        <a href={profile.hornetReportUrl ?? undefined} target="_blank" rel="noopener">Report it with a photograph</a>.
      </p>
      <p className={styles.bio}>
        Suspect foulbrood (AFB/EFB) or another notifiable bee pest? Report it promptly to{' '}
        <a href={profile.diseaseUrl ?? undefined} target="_blank" rel="noopener">{profile.diseaseAuthority}</a>.
      </p>
    </details>
  )
}
