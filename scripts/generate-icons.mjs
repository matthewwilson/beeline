import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'src/assets/icon.png')
const OUT = join(root, 'public/icons')

// Dark warm tone sampled from the source artwork's corners, so the maskable safe-zone
// padding blends seamlessly with the icon's own vignette.
const PAD = '#0e0b07'

await mkdir(OUT, { recursive: true })

for (const size of [192, 512]) {
  await sharp(SRC).resize(size, size, { fit: 'cover' }).png().toFile(join(OUT, `pwa-${size}.png`))
}

// iOS ignores transparency, so flatten onto the warm dark tone.
await sharp(SRC)
  .resize(180, 180, { fit: 'cover' })
  .flatten({ background: PAD })
  .png()
  .toFile(join(OUT, 'apple-touch-icon.png'))

// Maskable: scale the artwork into the inner ~82% safe zone on an opaque background.
const inner = Math.round(512 * 0.82)
const scaled = await sharp(SRC)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: PAD } })
  .composite([{ input: scaled, gravity: 'center' }])
  .png()
  .toFile(join(OUT, 'maskable-512.png'))

const icoBuffers = await Promise.all(
  [16, 32, 48].map((s) => sharp(SRC).resize(s, s, { fit: 'cover' }).png().toBuffer()),
)
await writeFile(join(OUT, 'favicon.ico'), await pngToIco(icoBuffers))

console.log('Generated PWA icons in public/icons/')
