# Northern Ireland Nature Recovery Networks

BeeLine has an optional map layer for the Northern Ireland Nature Recovery Network habitat
opportunity datasets published by the Northern Ireland Landscape Partnership. It is implemented
as decision-support context only: the polygons never enter forage scores, destination rankings,
bee flights or drone-congregation-area calculations.

## Deployment status

The project owner confirmed on 28 July 2026 that consent has been obtained for the use described
below. The layer is therefore enabled. Retain the consent record with the project and re-confirm it
before materially changing the use.

The ArcGIS items identify the data as Open Government Licence v3.0, but their metadata also says
that the mapping is for investigation and analysis only and should not be manipulated without prior
consent from Ulster Wildlife. OpenDataNI's terms say that item-specific licence terms apply where
they differ from the site's general terms.

The layer can be disabled without removing the integration by setting:

```text
VITE_HABITAT_NETWORKS_ENABLED=false
```

## Consented use

The integration is constrained to the following consented use:

- client-side, non-commercial display in a Northern Ireland beekeeping map
- live queries for a 5 km envelope around a user-selected hive
- display of the five published opportunity classes without reclassification or derived scoring
- selection of one habitat network at a time and styling solely to distinguish published classes
- no download feature, bulk extraction, editing, redistribution, persistent storage or service-worker caching
- clear attribution to the Northern Ireland Landscape Partnership, the OGL v3.0 licence and the
  published mapping methodology
- a visible warning that the polygons are decision-support mapping, not verified planting sites or
  substitutes for field assessment, landowner consent or checks for other protected habitats

## Sources

The implementation queries layer 1 of these ArcGIS FeatureServers:

| Habitat network | OpenDataNI / ArcGIS item ID | Service name |
|---|---|---|
| Lowland meadow | `c262ab98b1e74aed81c1d0403bb96396` | `Lowland_Meadow_Habitat_Network` |
| Traditional orchard | `4ab428739e884774b39e728c71c2b3b5` | `Traditional_Orchard_Habitats_Network` |
| Deciduous woodland | `071b664053cc4dcdb33d71b4f2b03bf5` | `Deciduous_Woodland_Habitat_Network` |
| Wood pasture and parkland | `f22083656c9e4bc7a005bdea89c64475` | `Wood_Pasture_and_Parkland_Habitat_Network` |
| Heath | `e11bc98daf934634beaa143abb3eb357` | `Heath_Habitat_Network` |

The query returns polygons only for the published `Class` values `Restorable Habitat`,
`Fragmentation Action Zone`, `Network Enhancement Zone 1`, `Network Enhancement Zone 2` and
`Network Expansion Zone`. Primary and associated habitat polygons are deliberately excluded.

- [Example OpenDataNI dataset record](https://admin.opendatani.gov.uk/dataset/traditional-orchard-habitat-network)
- [OpenDataNI terms and conditions](https://admin.opendatani.gov.uk/terms-and-conditions)
- [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
- [Nature Recovery Network mapping methodology](https://www.ulsterwildlife.org/sites/default/files/2022-10/EnvSys%20NI%20NRN%20mapping%20report.pdf)

The mapping is dated 2022 in the publisher's attribution and the example OpenDataNI catalogue
record was created in November 2024. Recheck the item metadata, service availability and permission
terms before each future enablement or material change of use.
