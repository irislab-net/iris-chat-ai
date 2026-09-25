/**
 * Rebuild square PWA / Apple touch / favicon icons from the circular brand SVG mark.
 * Usage: node scripts/generate-pwa-icons.mjs
 *
 * Favicon.ico includes 16 / 32 / 48 PNG frames — Google Search prefers multiples of 48px.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const markSvg = readFileSync(
  join(root, "public/exur-logo-light.svg"),
  "utf8"
)

/** Matches PWA / browser chrome light background. */
const LIGHT_BG = "#f5f5f5"

function extractInner(svg) {
  return svg
    .replace(/<\?xml[^>]*>/i, "")
    .replace(/<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim()
}

function buildLogoSvg({ size, padRatio = 0, bg = LIGHT_BG }) {
  const inner = extractInner(markSvg)
  const innerSize = size * (1 - padRatio * 2)
  const offset = (size - innerSize) / 2
  const scale = innerSize / 68
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    ${inner}
  </g>
</svg>`
}

function renderPng(svg) {
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng()
  )
}

function writePng(svg, outPath) {
  const png = renderPng(svg)
  writeFileSync(outPath, png)
  console.log(`wrote ${outPath} (${png.byteLength} bytes)`)
  return png
}

/**
 * Build a multi-resolution .ico that embeds PNG frames (Vista+).
 * @param {{ size: number, png: Buffer }[]} frames
 */
function encodeIco(frames) {
  const count = frames.length
  const headerSize = 6 + count * 16
  let offset = headerSize
  const entries = []
  for (const frame of frames) {
    const { size, png } = frame
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      bytes: png.byteLength,
      offset,
      png,
    })
    offset += png.byteLength
  }

  const buf = Buffer.alloc(offset)
  buf.writeUInt16LE(0, 0) // reserved
  buf.writeUInt16LE(1, 2) // type = icon
  buf.writeUInt16LE(count, 4)

  entries.forEach((entry, i) => {
    const o = 6 + i * 16
    buf.writeUInt8(entry.width, o)
    buf.writeUInt8(entry.height, o + 1)
    buf.writeUInt8(0, o + 2) // color palette
    buf.writeUInt8(0, o + 3) // reserved
    buf.writeUInt16LE(1, o + 4) // color planes
    buf.writeUInt16LE(32, o + 6) // bits per pixel
    buf.writeUInt32LE(entry.bytes, o + 8)
    buf.writeUInt32LE(entry.offset, o + 12)
    entry.png.copy(buf, entry.offset)
  })

  return buf
}

/** iOS home screen + install sheet — ~80% safe area (Apple squircle inset). */
const HOME_SCREEN_PAD = 0.1
/** Maskable safe zone ≈ center 80%. */
const MASK_PAD = 0.1
/** Favicons stay tighter for legibility at small sizes. */
const FAVICON_PAD = 0.06

writePng(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/icon-512.png")
)
writePng(
  buildLogoSvg({ size: 192, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/icon-192.png")
)
writePng(
  buildLogoSvg({ size: 180, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/apple-touch-icon.png")
)
writePng(
  buildLogoSvg({ size: 512, padRatio: MASK_PAD }),
  join(root, "public/icon-512-maskable.png")
)

const favicon32 = writePng(
  buildLogoSvg({ size: 32, padRatio: FAVICON_PAD }),
  join(root, "public/favicon-32.png")
)
const favicon48 = writePng(
  buildLogoSvg({ size: 48, padRatio: FAVICON_PAD }),
  join(root, "public/favicon-48.png")
)
const favicon16 = renderPng(
  buildLogoSvg({ size: 16, padRatio: FAVICON_PAD })
)

writePng(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "app/icon.png")
)
writePng(
  buildLogoSvg({ size: 180, padRatio: HOME_SCREEN_PAD }),
  join(root, "app/apple-icon.png")
)
writePng(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/organization-logo.png")
)

const ico = encodeIco([
  { size: 16, png: favicon16 },
  { size: 32, png: favicon32 },
  { size: 48, png: favicon48 },
])
const icoApp = join(root, "app/favicon.ico")
const icoPublic = join(root, "public/favicon.ico")
writeFileSync(icoApp, ico)
writeFileSync(icoPublic, ico)
console.log(`wrote ${icoApp} (${ico.byteLength} bytes)`)
console.log(`wrote ${icoPublic} (${ico.byteLength} bytes)`)
