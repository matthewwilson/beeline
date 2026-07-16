import styles from './controls.module.css'
import { JURISDICTION_PROFILES } from '../data/jurisdictionProfiles'
import { useStore } from '../store/useStore'

export function Credits() {
  const jurisdiction = useStore((state) => state.activeJurisdiction)
  const habitatCredit = jurisdiction ? JURISDICTION_PROFILES[jurisdiction].habitatCredit : null
  return (
    <p className={styles.credits}>
      Forage values from Baude et al. (UKCEH/EIDC, OGL). {habitatCredit ? `Habitats from ${habitatCredit}. ` : ''}
      Weather from Open-Meteo. Hornet records from NBN Atlas or NBDC/GBIF. Planting from AIPP / RHS. Map &amp; land use ©
      OpenStreetMap contributors. Regional boundaries from geoBoundaries (CC BY 4.0).
    </p>
  )
}
