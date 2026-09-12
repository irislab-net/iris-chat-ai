/**
 * Rebuild square PWA / Apple touch icons from the brand SVG mark.
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const markSvg = readFileSync(join(root, "public/iris-lab-logo-dark.svg"), "utf8")
const inner = markSvg
  .replace(/<\?xml[^>]*>/i, "")
  .replace(/<svg[^>]*>/i, "")
  .replace(/<\/svg>\s*$/i, "")
  .trim()

const BG = "#252525"

function buildIconSvg({ size, padRatio, bg }) {
  const innerSize = size * (1 - padRatio * 2)
  const offset = (size - innerSize) / 2
  const scale = innerSize / 512
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    ${inner}
  </g>
</svg>`
}

function render(svg, outPath) {
  const png = new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng()
  writeFileSync(outPath, png)
  console.log(`wrote ${outPath} (${png.byteLength} bytes)`)
}

/** Modest inset so iOS / Android masks do not clip the mark. */
const ANY_PAD = 0.12
/** Maskable safe zone ≈ center 80%. */
const MASK_PAD = 0.2

render(buildIconSvg({ size: 512, padRatio: ANY_PAD, bg: BG }), join(root, "public/icon-512.png"))
render(buildIconSvg({ size: 192, padRatio: ANY_PAD, bg: BG }), join(root, "public/icon-192.png"))
render(buildIconSvg({ size: 180, padRatio: ANY_PAD, bg: BG }), join(root, "public/apple-touch-icon.png"))
render(
  buildIconSvg({ size: 512, padRatio: MASK_PAD, bg: BG }),
  join(root, "public/icon-512-maskable.png")
)
render(
  buildIconSvg({ size: 512, padRatio: ANY_PAD, bg: BG }),
  join(root, "public/organization-logo.png")
)
render(buildIconSvg({ size: 512, padRatio: ANY_PAD, bg: BG }), join(root, "public/Logo.png"))
