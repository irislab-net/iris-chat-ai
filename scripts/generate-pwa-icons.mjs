/**
 * Rebuild square PWA / Apple touch / favicon icons.
 *
 * Install icons: full-bleed brand blue + white mark — no white plate, border, or
 * shadow. Maskable stays opaque to the edges so Android adaptive crop stays clean.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Landing / CTA brand blue — matches site accent. */
const BRAND_BLUE = "#2563EB"
const MARK_FILL = "#ffffff"
/** Artboard of the Exur mark path (lib/exur-logo-path.ts). */
const MARK_VIEWBOX = 69
const MARK_PATH =
  "M25.01 8.51643C29.815 6.87597 34.9767 6.5596 39.9477 7.60088C44.9188 8.64215 49.5139 11.0022 53.2459 14.4309C54.3373 15.4332 54.4545 16.9795 53.7652 18.1921C53.6101 18.5236 53.401 18.8367 53.1333 19.1156L21.5862 51.7955C23.9172 53.522 26.5828 54.749 29.4146 55.3992C32.2463 56.0493 35.1829 56.1084 38.0387 55.5727C41.0537 55.009 43.9081 53.7958 46.4017 52.0183C46.581 51.8918 46.7675 51.7795 46.9613 51.6812L37.6849 42.5472C37.3628 42.2306 37.1065 41.8539 36.9308 41.4388C36.7551 41.0236 36.6633 40.5781 36.6608 40.1276C36.6582 39.6772 36.7449 39.2307 36.9159 38.8136C37.0869 38.3964 37.3388 38.0169 37.6573 37.6967L37.9813 37.371C38.6238 36.7244 39.4983 36.3582 40.4122 36.3528C41.3262 36.3475 42.2049 36.7034 42.855 37.3424L56.9764 51.2137C57.6264 51.8529 57.9946 52.7227 57.9999 53.6319C58.0053 54.541 57.6475 55.4151 57.0051 56.0619L56.6788 56.3887C56.0361 57.0352 55.1616 57.4012 54.2477 57.4063C53.3337 57.4115 52.4551 57.0553 51.8051 56.4162L51.9591 56.5945C51.8189 56.7667 51.6561 56.9251 51.4708 57.0699C46.4907 60.9376 40.3474 63.0263 34.0294 62.9998C27.7113 62.9732 21.586 60.833 16.639 56.9236L16 57.4063C15.6866 57.7312 15.3119 57.9915 14.8973 58.1723C14.4827 58.3532 14.0364 58.451 13.5838 58.4602C13.1313 58.4695 12.6813 58.3899 12.2596 58.2262C11.838 58.0624 11.4528 57.8176 11.1263 57.5058L10.7931 57.1869C10.134 56.5571 9.75334 55.6927 9.73481 54.7838C9.71628 53.8748 10.0614 52.9958 10.6943 52.3399L11.524 51.6583C7.86487 46.741 5.92543 40.7669 6.00219 34.6494C6.07896 28.532 8.16772 22.6079 11.9491 17.783L11.3712 17.2458C11.0492 16.9293 10.793 16.5528 10.6173 16.1378C10.4415 15.7228 10.3497 15.2774 10.347 14.8271C10.3444 14.3768 10.4309 13.9304 10.6017 13.5133C10.7725 13.0963 11.0242 12.7168 11.3424 12.3965L11.6676 12.0708C12.31 11.4241 13.1843 11.0576 14.0983 11.0521C15.0122 11.0465 15.891 11.4023 16.5413 12.0411L17.1893 12.6503C19.5606 10.8705 22.2002 9.47524 25.01 8.51643ZM39.7346 14.8195C36.7955 14.0148 33.7158 13.8548 30.7085 14.3505C27.7012 14.8462 24.838 15.9858 22.3169 17.6904L29.9285 25.1901C30.2505 25.5067 30.5066 25.8832 30.6822 26.2983C30.8578 26.7133 30.9495 27.1587 30.9521 27.609C30.9546 28.0593 30.868 28.5057 30.6971 28.9227C30.5262 29.3397 30.2744 29.7192 29.9561 30.0394L29.6321 30.3651C28.9896 31.0117 28.1152 31.3779 27.2012 31.3833C26.2872 31.3886 25.4085 31.0327 24.7584 30.3937L17.0514 22.8014C14.6204 26.1711 13.2509 30.1835 13.1167 34.329C12.9825 38.4745 14.0897 42.5661 16.2977 46.0844C16.3774 46.2101 16.459 46.3351 16.5425 46.4593L44.9449 17.0344C43.3165 16.066 41.5638 15.3202 39.7346 14.8195Z"

/**
 * Opaque brand-blue tile + white mark. No plate padding, border, or shadow.
 * @param {{ size: number, markPadRatio?: number }} opts
 */
function buildIconSvg({ size, markPadRatio = 0.18 }) {
  const innerSize = size * (1 - markPadRatio * 2)
  const offset = (size - innerSize) / 2
  const scale = innerSize / MARK_VIEWBOX
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND_BLUE}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${MARK_PATH}" fill="${MARK_FILL}"/>
  </g>
</svg>`
}

function renderPng(svg) {
  return Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: "original" },
      // Flatten alpha onto brand blue so OS masks never show a white halo.
      background: BRAND_BLUE,
    }).render().asPng()
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
  buf.writeUInt16LE(0, 0)
  buf.writeUInt16LE(1, 2)
  buf.writeUInt16LE(count, 4)

  entries.forEach((entry, i) => {
    const o = 6 + i * 16
    buf.writeUInt8(entry.width, o)
    buf.writeUInt8(entry.height, o + 1)
    buf.writeUInt8(0, o + 2)
    buf.writeUInt8(0, o + 3)
    buf.writeUInt16LE(1, o + 4)
    buf.writeUInt16LE(32, o + 6)
    buf.writeUInt32LE(entry.bytes, o + 8)
    buf.writeUInt32LE(entry.offset, o + 12)
    entry.png.copy(buf, entry.offset)
  })

  return buf
}

/** Home-screen / any — mark inset so squircle mask does not clip strokes. */
const HOME_MARK_PAD = 0.16
/** Maskable safe zone ≈ center 80%. */
const MASK_MARK_PAD = 0.2
/** Favicons — slightly tighter for legibility at 16–48px. */
const FAVICON_MARK_PAD = 0.12

writePng(
  buildIconSvg({ size: 512, markPadRatio: HOME_MARK_PAD }),
  join(root, "public/icon-512.png")
)
writePng(
  buildIconSvg({ size: 192, markPadRatio: HOME_MARK_PAD }),
  join(root, "public/icon-192.png")
)
writePng(
  buildIconSvg({ size: 180, markPadRatio: HOME_MARK_PAD }),
  join(root, "public/apple-touch-icon.png")
)
writePng(
  buildIconSvg({ size: 512, markPadRatio: MASK_MARK_PAD }),
  join(root, "public/icon-512-maskable.png")
)

const favicon32 = writePng(
  buildIconSvg({ size: 32, markPadRatio: FAVICON_MARK_PAD }),
  join(root, "public/favicon-32.png")
)
const favicon48 = writePng(
  buildIconSvg({ size: 48, markPadRatio: FAVICON_MARK_PAD }),
  join(root, "public/favicon-48.png")
)
const favicon16 = renderPng(
  buildIconSvg({ size: 16, markPadRatio: FAVICON_MARK_PAD })
)

writePng(
  buildIconSvg({ size: 512, markPadRatio: HOME_MARK_PAD }),
  join(root, "app/icon.png")
)
writePng(
  buildIconSvg({ size: 180, markPadRatio: HOME_MARK_PAD }),
  join(root, "app/apple-icon.png")
)
writePng(
  buildIconSvg({ size: 512, markPadRatio: HOME_MARK_PAD }),
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
