# Regional data coverage and provenance

BeeLine detects the jurisdiction from the hive coordinates using simplified administrative
boundaries, then requests the relevant authoritative habitat inventory. A hive within 5 km of a
land border queries both jurisdictions so forage just across the border is not omitted. These
layers supplement OpenStreetMap rather than replace it.

## Jurisdiction routing

The bundled boundaries come from geoBoundaries `gbOpen` GBR ADM1 and IRL ADM0 releases and are
simplified to roughly 100 m for browser-side point and border-distance checks. They are routing
geometry, not a statement of legal boundary precision. The Isle of Man, Channel Islands and other
locations outside Northern Ireland, the Republic of Ireland, Scotland, England and Wales use
generic coverage: OpenStreetMap forage, observations, weather and elevation remain available,
while country-specific habitats and biosecurity guidance are not shown.

## Habitat providers

| Jurisdiction | Dataset | Live service | Licence / attribution | BeeLine mapping |
|---|---|---|---|---|
| Northern Ireland | DAERA/NIEA Priority Habitats | OpenDataNI ArcGIS FeatureServers | Open Government Licence | heath, meadow, scrub and wood from the five priority-habitat layers |
| England | Natural England Priority Habitats Inventory | ArcGIS FeatureServer | Open Government Licence, with source-specific third-party attribution where stated | `HabCodes` mapped to wood, heath, meadow, scrub and traditional orchard |
| Scotland | NatureScot Habitat Map of Scotland | ArcGIS FeatureServer | Open Government Licence | relevant `HABITAT_CODE` and habitat descriptions mapped to wood, scrub, heath and meadow; mosaic proportion scales the contribution |
| Wales | Natural Resources Wales Phase 1 Habitat Survey | DataMapWales WFS | Open Government Licence | Phase 1 codes mapped to wood, scrub, meadow, heath, farmland and park |
| Republic of Ireland | NPWS Article 17 terrestrial habitats, National Survey of Native Woodlands and Irish Semi-natural Grassland Survey | ArcGIS FeatureServers | NPWS open-data terms / CC BY 4.0 attribution | Article 17 codes mapped by habitat family; woodland and grassland surveys have fixed forage classes |

The client requests a 5 km bounding envelope, paginates service results and preserves polygon
geometry where supplied. Features keep their exact provider key, so popups and destination rows
can distinguish a national inventory from OpenStreetMap or a field observation. Each provider
fails independently: data from a working source still appears when another source is unavailable.

Service entry points are defined in:

- `src/services/habitats.ts` for DAERA/NIEA
- `src/services/englandHabitats.ts` for Natural England
- `src/services/scotlandHabitats.ts` for NatureScot
- `src/services/walesHabitats.ts` for Natural Resources Wales
- `src/services/irelandHabitats.ts` for NPWS

## Weather and bloom timing

Open-Meteo provides current weather and daily mean temperatures for the current year plus the
previous ten years at the hive coordinates. BeeLine calculates cumulative growing degree days
above 5 C for each year, then builds a mean local curve when at least five years are available.
Auto-season bloom scoring compares the current total with thermal thresholds derived from the
reference bloom windows. Failed or incomplete archive requests fall back to day-of-year scoring;
current flying-weather guidance remains independent.

## Biosecurity routing

UK hives query the NBN Atlas for published *Vespa velutina* records within 10 km. Republic of
Ireland hives query GBIF for the same species within a 10 km polygon and restrict results to the
National Biodiversity Data Centre institution code. The panel links to the relevant national
reporting route and bee-health authority. A zero is displayed only after a successful request;
network failure remains visibly distinct from no published records.

These occurrence checks report records in the source APIs, not confirmed absence or a live risk
assessment. Users should follow the linked official reporting guidance for suspected sightings.
