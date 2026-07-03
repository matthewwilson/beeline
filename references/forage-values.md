# Forage value + bloom-timing provenance

BeeLine's per-class forage `base` values (0-10) and bloom windows are not arbitrary. They are
derived from published nectar/pollen research plus standard NI/UK forage references, and tuned
to the Northern Ireland season. This file documents where the numbers come from.

## Why not the raw dataset?
The definitive open dataset is Baude et al.'s measured nectar and pollen productivity for common
British plants, published under the **Open Government Licence** via NERC/UKCEH EIDC:
- Nectar sugar (2016): https://catalogue.ceh.ac.uk/documents/69402002-1676-4de9-a04e-d17e827db93c
- Pollen production (2025): https://catalogue.ceh.ac.uk/documents/0b454d53-dfe7-48fd-9e18-b683d004b159
- Paper: Baude et al. 2016, *Nature* 530:85-88, "Historical nectar assessment reveals the fall and
  rise of floral resources in Britain".

The EIDC data files are OGL but sit behind a licence-acceptance download gate (not a direct CSV
fetch), so BeeLine does not redistribute the raw file. Instead the `base` values below are a
**normalised (0-10) ranking** informed by that work's relative nectar importance and by standard
forage references. A future update can drop in the exact per-species figures once downloaded.

## Class -> representative species -> normalised base
| BeeLine class | Representative nectar/pollen plants | Relative importance | base |
|---|---|---|---|
| hedge | hawthorn (*Crataegus*), blackthorn (*Prunus spinosa*), bramble (*Rubus fruticosus*) | Brambles + hawthorn are among Baude's top national nectar providers; hedgerows are the dominant NI forage feature | 9 |
| heath | heather (*Calluna vulgaris*) | Heather is a top national nectar source; critical late-summer flow | 9 |
| meadow | white clover (*Trifolium repens*), knapweed (*Centaurea*), dandelion (*Taraxacum*) | Clover + knapweed are top providers; species-rich grassland is high value | 8 |
| scrub | bramble, gorse (*Ulex*) | Bramble a top provider; gorse near year-round | 8 |
| garden | mixed ornamentals + tree species | Urban nectar studies (Tew et al.) show gardens are consistently rich | 7 |
| orchard | apple/pear/cherry (*Malus/Pyrus/Prunus*) | Strong but short spring blossom pulse | 7 |
| allotments | flowering veg, soft fruit, beans | Mixed, moderate | 6 |
| farmland | oilseed rape (*Brassica napus*), field beans, clover leys | Very high when OSR flowers, otherwise low - captured via bloom window, not base | 6 |
| wood | willow (*Salix*), sycamore (*Acer*), lime (*Tilia*) | Willow early pollen, lime brief summer flow; patchy | 5 |
| park | amenity grass + verges, ornamental trees | Mostly low, some tree/border value | 5 |

## Bloom windows (day-of-year, NI-tuned)
`BLOOM[class] = [start, peakStart, peakEnd, end]`. NI flowers roughly 1-2 weeks later than
southern England, so windows are shifted accordingly. In "Auto" season mode these windows are
shifted earlier/later by a growing-degree-day (base 5C) anomaly computed from Open-Meteo, so a
warm year advances bloom. Windows are approximate and intended for relative ranking, not
phenological prediction. Sources: Woodland Trust Nature's Calendar summaries, standard UK/Ireland
beekeeping forage calendars, and the All-Ireland Pollinator Plan.

## GDD baseline
`GDD_BASELINE` is a rough NI-lowland cumulative growing-degree-day (base 5C) curve by day-of-year,
used only to express the current year as "~N days ahead/behind average". It is an approximation.

## Field flowers (`FORAGE_PLANTS`)
The "add a flower" field log maps each curated plant to an existing forage class so it inherits
that class's colour, pollen colour and Baude-derived base value; the observation is then scored
with the highest confidence tier (`observed` ×1.5 > `surveyed` ×1.25 > `osm` ×1.0), since a plant
you saw in person is stronger evidence than a land-use polygon. Mapping: hawthorn/blackthorn→hedge;
bramble/gorse/ivy→scrub; heather→heath; white clover/dandelion/knapweed→meadow; willow/lime/
sycamore→wood; oilseed rape/field beans→farmland; apple→orchard; phacelia/borage/comfrey→garden.
Free-text "other" → `garden` (a moderate default).

## Gap-filling plants (`GAP_PLANTS`)
Suggestions for filling a detected forage gap are drawn from the All-Ireland Pollinator Plan and
RHS Plants for Pollinators, keyed by approximate flowering month. The classic UK/Ireland "June
gap" (between spring blossom/oilseed rape and mid-summer bramble/clover) is filled by e.g.
phacelia, borage, white clover, comfrey, cotoneaster, field beans, lime and foxglove.
