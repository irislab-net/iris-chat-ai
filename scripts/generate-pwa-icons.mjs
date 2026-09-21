/**
 * Rebuild square PWA / Apple touch icons from the circular brand SVG mark.
 * Usage: node scripts/generate-pwa-icons.mjs
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

function render(svg, outPath) {
  const png = new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng()
  writeFileSync(outPath, png)
  console.log(`wrote ${outPath} (${png.byteLength} bytes)`)
}

/** iOS home screen + install sheet — ~80% safe area (Apple squircle inset). */
const HOME_SCREEN_PAD = 0.1
/** Maskable safe zone ≈ center 80%. */
const MASK_PAD = 0.1
/** Favicons stay tighter for legibility at small sizes. */
const FAVICON_PAD = 0.06

render(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/icon-512.png")
)
render(
  buildLogoSvg({ size: 192, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/icon-192.png")
)
render(
  buildLogoSvg({ size: 180, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/apple-touch-icon.png")
)
render(
  buildLogoSvg({ size: 512, padRatio: MASK_PAD }),
  join(root, "public/icon-512-maskable.png")
)
render(
  buildLogoSvg({ size: 32, padRatio: FAVICON_PAD }),
  join(root, "public/favicon-32.png")
)
render(
  buildLogoSvg({ size: 48, padRatio: FAVICON_PAD }),
  join(root, "public/favicon-48.png")
)
render(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "app/icon.png")
)
render(
  buildLogoSvg({ size: 180, padRatio: HOME_SCREEN_PAD }),
  join(root, "app/apple-icon.png")
)
render(
  buildLogoSvg({ size: 512, padRatio: HOME_SCREEN_PAD }),
  join(root, "public/organization-logo.png")
)
