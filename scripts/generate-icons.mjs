import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceIconPath = join(root, 'src/assets/icon.png')
const outputIconsPath = join(root, 'public/icons')
const socialCardPath = join(root, 'public/social-card.png')

// Dark warm tone sampled from the source artwork's corners, so the maskable safe-zone
// padding blends seamlessly with the icon's own vignette.
const paddingColour = '#0e0b07'

await mkdir(outputIconsPath, { recursive: true })

for (const size of [192, 512]) {
  await sharp(sourceIconPath).resize(size, size, { fit: 'cover' }).png().toFile(join(outputIconsPath, `pwa-${size}.png`))
}

// iOS ignores transparency, so flatten onto the warm dark tone.
await sharp(sourceIconPath)
  .resize(180, 180, { fit: 'cover' })
  .flatten({ background: paddingColour })
  .png()
  .toFile(join(outputIconsPath, 'apple-touch-icon.png'))

// Maskable: scale the artwork into the inner ~82% safe zone on an opaque background.
const inner = Math.round(512 * 0.82)
const scaled = await sharp(sourceIconPath)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: paddingColour } })
  .composite([{ input: scaled, gravity: 'center' }])
  .png()
  .toFile(join(outputIconsPath, 'maskable-512.png'))

const icoBuffers = await Promise.all(
  [16, 32, 48].map((size) => sharp(sourceIconPath).resize(size, size, { fit: 'cover' }).png().toBuffer()),
)
await writeFile(join(outputIconsPath, 'favicon.ico'), await pngToIco(icoBuffers))

const socialCardArtwork = await sharp(sourceIconPath)
  .resize(520, 520, { fit: 'cover' })
  .png()
  .toBuffer()

const socialCardBackground = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#21160b"/>
        <stop offset="0.58" stop-color="#120d07"/>
        <stop offset="1" stop-color="#080604"/>
      </linearGradient>
      <radialGradient id="glow" cx="78%" cy="48%" r="55%">
        <stop offset="0" stop-color="#f6a800" stop-opacity="0.3"/>
        <stop offset="1" stop-color="#f6a800" stop-opacity="0"/>
      </radialGradient>
      <pattern id="hexagons" width="72" height="124.7" patternUnits="userSpaceOnUse">
        <path d="M36 2 70 21.6v39.2L36 80.4 2 60.8V21.6Z" fill="none" stroke="#f6a800" stroke-opacity="0.08" stroke-width="2"/>
        <path d="M72 64.3 106 83.9v39.2L72 142.7 38 123.1V83.9Z" fill="none" stroke="#f6a800" stroke-opacity="0.08" stroke-width="2"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect width="1200" height="630" fill="url(#hexagons)"/>
    <path d="M0 582h1200v48H0z" fill="#f6a800"/>
    <circle cx="938" cy="292" r="260" fill="#f6a800" fill-opacity="0.13" stroke="#f6a800" stroke-opacity="0.3" stroke-width="2"/>
    <text x="72" y="98" fill="#f6a800" font-family="Georgia, serif" font-size="40" font-weight="700" letter-spacing="-1">BeeLine</text>
    <text x="72" y="216" fill="#fff8e8" font-family="Georgia, serif" font-size="76" font-weight="700" letter-spacing="-2">Follow the</text>
    <text x="72" y="298" fill="#fff8e8" font-family="Georgia, serif" font-size="76" font-weight="700" letter-spacing="-2">forage.</text>
    <text x="76" y="374" fill="#d5c8ac" font-family="Arial, sans-serif" font-size="28">See where your bees are likely flying</text>
    <text x="76" y="415" fill="#d5c8ac" font-family="Arial, sans-serif" font-size="28">for nectar and pollen.</text>
    <rect x="72" y="473" width="324" height="54" rx="27" fill="#f6a800"/>
    <text x="98" y="509" fill="#120d07" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="1.2">BEE FORAGE MAP</text>
  </svg>
`)

await sharp(socialCardBackground)
  .composite([
    {
      input: socialCardArtwork,
      left: 678,
      top: 32,
      blend: 'over',
    },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile(socialCardPath)

console.log('Generated PWA icons and social sharing card')
