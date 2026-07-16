# Forage value + bloom-timing provenance

BeeLine's per-class forage `base` values (0-10) and bloom windows are not arbitrary. They are
derived from published nectar/pollen research plus standard UK and Ireland forage references.
This file documents where the numbers come from and how local weather adjusts their timing.

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
| hedge | hawthorn (*Crataegus*), blackthorn (*Prunus spinosa*), bramble (*Rubus fruticosus*) | Brambles + hawthorn are among Baude's top national nectar providers; hedgerows are a major forage feature | 9 |
| heath | heather (*Calluna vulgaris*) | Heather is a top national nectar source; critical late-summer flow | 9 |
| meadow | white clover (*Trifolium repens*), knapweed (*Centaurea*), dandelion (*Taraxacum*) | Clover + knapweed are top providers; species-rich grassland is high value | 8 |
| scrub | bramble, gorse (*Ulex*) | Bramble a top provider; gorse near year-round | 8 |
| garden | mixed ornamentals + tree species | Urban nectar studies (Tew et al.) show gardens are consistently rich | 7 |
| orchard | apple/pear/cherry (*Malus/Pyrus/Prunus*) | Strong but short spring blossom pulse | 7 |
| allotments | flowering veg, soft fruit, beans | Mixed, moderate | 6 |
| farmland | oilseed rape (*Brassica napus*), field beans, clover leys | Very high when flowering crops are present, otherwise low; generic OSM farmland is discounted unless crop tags indicate rape, beans or clover | 6 |
| wood | willow (*Salix*), sycamore (*Acer*), lime (*Tilia*) | Willow early pollen, lime brief summer flow; patchy | 5 |
| park | amenity grass + verges, ornamental trees | Mostly low, some tree/border value | 5 |

## Bloom windows and thermal timing
`BLOOM[class] = [start, peakStart, peakEnd, end]` stores the original NI-tuned reference windows.
In "Auto" mode those day-of-year points are converted to growing-degree-day (base 5C) thresholds
using the reference curve, then compared with the current cumulative total at the hive. This
makes the bloom score respond to local thermal progress rather than applying one national calendar.
Windows remain approximate and are intended for relative ranking, not phenological prediction.
Sources: Woodland Trust Nature's Calendar summaries, standard UK/Ireland beekeeping forage
calendars and the All-Ireland Pollinator Plan.

Each class also has an off-season floor. Short pulse resources such as orchard blossom and
flowering crops drop close to zero outside their bloom window; mixed habitats such as gardens,
parks, allotments and scrub retain a higher floor because they contain many species with staggered
flowering.

## Growing-degree-day baseline
`GROWING_DEGREE_DAYS_BASELINE` is the original rough NI-lowland reference curve used to translate
the static bloom windows into thermal thresholds. Open-Meteo archive data supplies a coordinate-
specific mean cumulative curve from the previous ten complete or partial seasons. At least five
years are required; otherwise Auto mode falls back to the static day-of-year windows. The weather
panel's "ahead/behind local average" phrase also uses that local curve.

## Field flowers (`FORAGE_PLANTS`)
The "add a flower" field log maps each curated plant to an existing forage class so it inherits
that class's colour, pollen colour and Baude-derived base value; the observation is then scored
with the highest confidence tier (`observed` ×1.5 > `surveyed` ×1.25 > `openStreetMap` ×1.0), since a plant
you saw in person is stronger evidence than a land-use polygon. Mapping: hawthorn/blackthorn→hedge;
bramble/gorse/ivy→scrub; heather→heath; white clover/dandelion/knapweed→meadow; willow/lime/
sycamore→wood; oilseed rape/field beans→farmland; apple→orchard; phacelia/borage/comfrey/
lavender/rose/foxglove/peony→garden. Free-text "other" → `garden` (a moderate default).

Known observed flowers can override their class bloom timing where the class would be misleading:
bramble, gorse and ivy still display as `scrub`, but score with plant-specific windows so ivy is
late-season forage and gorse is treated as extended/winter-spring forage rather than summer bramble.

## Habitat area (`areaFactor`)
Authoritative habitat polygons can carry a mapped area (hectares) that a point source (an OSM tag
or an observed flower) does not. A larger patch plausibly holds more forage, so the score
gets a gentle, saturating lift: `areaFactor = clamp(1 + 0.12 × log10(1 + hectares), 1, 1.4)`.
Area-less features (undefined or 0) score at ×1, so only surveyed habitats are affected. The log
and the ×1.4 cap keep it a tie-breaker: it nudges the ranking of comparable habitats without ever
outweighing distance decay, bloom timing or the confidence tier.

Where service geometry is available, distance and bearing are measured to the nearest useful part
of the line/polygon rather than to its centre. The centre is kept for marker placement only. This
matters for long hedges, tree rows and large or concave habitat polygons that may intersect a
hive's 5 km range even when their centre does not.

## Gap-filling plants (`GAP_PLANTS`)
Suggestions for filling a detected forage gap are drawn from the All-Ireland Pollinator Plan and
RHS Plants for Pollinators, keyed by approximate flowering month. The classic UK/Ireland "June
gap" (between spring blossom/oilseed rape and mid-summer bramble/clover) is filled by e.g.
phacelia, borage, white clover, comfrey, cotoneaster, field beans, lime and foxglove. The later
autumn dearth (after the main summer flow, before ivy) is filled by e.g. ivy, Michaelmas daisy
and sedum.
