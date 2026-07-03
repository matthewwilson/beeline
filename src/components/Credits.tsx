import styles from './controls.module.css'

export function Credits() {
  return (
    <p className={styles.credits}>
      Forage values from Baude et al. (UKCEH/EIDC, OGL). Habitats from DAERA/NIEA Priority Habitats (OGL). Weather from
      Open-Meteo. Hornet records from NBN Atlas. Planting from AIPP / RHS. Map &amp; land use © OpenStreetMap
      contributors.
    </p>
  )
}
