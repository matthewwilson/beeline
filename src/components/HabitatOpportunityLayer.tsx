import { HABITAT_NETWORKS_ENABLED } from '../config/features'
import { HABITAT_NETWORK_CLASSES, HABITAT_NETWORK_KEYS, HABITAT_NETWORKS } from '../data/habitatNetworks'
import { captureEvent } from '../lib/analytics'
import { useStore } from '../store/useStore'
import type { HabitatNetworkKey } from '../types'
import { ToggleSwitch } from './ToggleSwitch'
import styles from './controls.module.css'

export function HabitatOpportunityLayer() {
  const activeHive = useStore((s) => s.activeHive)
  const activeJurisdiction = useStore((s) => s.activeJurisdiction)
  const showHabitatOpportunities = useStore((s) => s.showHabitatOpportunities)
  const selectedHabitatNetwork = useStore((s) => s.selectedHabitatNetwork)
  const habitatOpportunityStatus = useStore((s) => s.habitatOpportunityStatus)
  const toggleHabitatOpportunities = useStore((s) => s.toggleHabitatOpportunities)
  const selectHabitatNetwork = useStore((s) => s.selectHabitatNetwork)

  if (!HABITAT_NETWORKS_ENABLED) return null

  const handleToggle = () => {
    captureEvent('habitat_opportunities_toggled', { enabled: !showHabitatOpportunities })
    toggleHabitatOpportunities()
  }

  const handleNetworkChange = (network: HabitatNetworkKey) => {
    selectHabitatNetwork(network)
    captureEvent('habitat_network_selected', { network })
  }

  return (
    <div className={styles.opportunityControl}>
      <ToggleSwitch label="Show habitat opportunities" checked={showHabitatOpportunities} onToggle={handleToggle} />

      {showHabitatOpportunities ? (
        <>
          {!activeHive ? (
            <p className={`hint ${styles.blockHint}`}>Select a hive to inspect nearby habitat connections.</p>
          ) : null}

          {activeHive && activeJurisdiction === 'northernIreland' ? (
            <label className={styles.networkPicker}>
              <span>Habitat network</span>
              <select
                className="select"
                value={selectedHabitatNetwork}
                onChange={(event) => handleNetworkChange(event.target.value as HabitatNetworkKey)}
              >
                {HABITAT_NETWORK_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {HABITAT_NETWORKS[key].label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {activeHive && habitatOpportunityStatus === 'loading' ? (
            <p className={`hint ${styles.blockHint}`}>Reading the published habitat network…</p>
          ) : null}
          {activeHive && habitatOpportunityStatus === 'empty' ? (
            <p className={`hint ${styles.blockHint}`}>No mapped opportunities of this type were returned nearby.</p>
          ) : null}
          {activeHive && habitatOpportunityStatus === 'unavailable' ? (
            <p className={`hint ${styles.blockHint}`}>
              {activeJurisdiction === 'northernIreland'
                ? 'The habitat-network service is unavailable right now.'
                : 'This opportunity mapping is available for Northern Ireland hives only.'}
            </p>
          ) : null}

          {habitatOpportunityStatus === 'ready' ? (
            <ul className={styles.opportunityLegend}>
              {Object.entries(HABITAT_NETWORK_CLASSES).map(([networkClass, meta]) => (
                <li key={networkClass} className={styles.opportunityRow}>
                  <span
                    className={styles.opportunitySwatch}
                    style={{ borderColor: meta.colour, background: `${meta.colour}33` }}
                  />
                  <span>{meta.shortLabel}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <p className={`hint ${styles.blockHint}`}>
            Published decision-support zones, not confirmed planting sites. Check conditions, other habitats and land access in the field.
          </p>
          <p className={styles.credits}>
            © Northern Ireland Landscape Partnership, 2022. OGL v3.0.{' '}
            <a href="https://www.ulsterwildlife.org/sites/default/files/2022-10/EnvSys%20NI%20NRN%20mapping%20report.pdf">
              Mapping methodology
            </a>
          </p>
        </>
      ) : null}
    </div>
  )
}
