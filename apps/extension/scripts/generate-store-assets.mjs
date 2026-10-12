#!/usr/bin/env node
/**
 * Chrome Web Store graphic assets (exact sizes, opaque / no alpha).
 *
 * Outputs to apps/extension/store-assets/
 */
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { deflateSync } from "node:zlib"
import { Resvg } from "@resvg/resvg-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "store-assets")
const publicDir = join(root, "public")
const cropsDir = join(outDir, "_crops")

mkdirSync(outDir, { recursive: true })
mkdirSync(cropsDir, { recursive: true })

function pngFileDataUri(filePath) {
  return `data:image/png;base64,${readFileSync(filePath).toString("base64")}`
}

/** Phone body inside 1280×800 framed store screenshots (caption excluded). */
const PHONE_CROP = { x: 454, y: 40, w: 372, h: 700 }

function ensurePhoneCrop(screenshotName) {
  const src = join(outDir, `${screenshotName}.png`)
  const dest = join(cropsDir, `${screenshotName}-phone.png`)
  if (!existsSync(src)) {
    throw new Error(`Missing screenshot for promo compose: ${src}`)
  }
  // Prefer macOS sips when available; otherwise keep an existing crop.
  try {
    execFileSync(
      "sips",
      [
        "-c",
        String(PHONE_CROP.h),
        String(PHONE_CROP.w),
        "--cropOffset",
        String(PHONE_CROP.y),
        String(PHONE_CROP.x),
        src,
        "--out",
        dest,
      ],
      { stdio: "ignore" }
    )
  } catch {
    if (!existsSync(dest)) {
      throw new Error(
        `Could not crop ${screenshotName} (sips missing) and no cached crop at ${dest}`
      )
    }
  }
  return dest
}

/** Chat header shows a Free plan chip — paint it out for CWS Red Nickel. */
function chatPhoneCleanDataUri() {
  const raw = pngFileDataUri(ensurePhoneCrop("screenshot-2-chat"))
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="372" height="700" viewBox="0 0 372 700" xmlns="http://www.w3.org/2000/svg">
  <image href="${raw}" width="372" height="700"/>
  <!-- Cover plan badge under avatar ("Free") -->
  <rect x="288" y="74" width="58" height="20" rx="6" fill="#F4F6F8"/>
</svg>`
  const png = renderSvgToRgbPng(svg, 372, 700)
  return `data:image/png;base64,${png.toString("base64")}`
}

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, "ascii")
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

/** Encode opaque RGB PNG (color type 2, no alpha) — required by CWS screenshots/tiles. */
function encodeRgbPng(width, height, rgba) {
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4
      const di = y * (stride + 1) + 1 + x * 3
      const a = rgba[si + 3] / 255
      // composite on white
      raw[di] = Math.round(rgba[si] * a + 255 * (1 - a))
      raw[di + 1] = Math.round(rgba[si + 1] * a + 255 * (1 - a))
      raw[di + 2] = Math.round(rgba[si + 2] * a + 255 * (1 - a))
    }
  }
  const compressed = deflateSync(raw, { level: 9 })
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2 // RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

function renderSvgToRgbPng(svg, width, height) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "white",
  })
  const img = resvg.render()
  const rgba = img.pixels
  // resvg may not match exact height if aspect differs — crop/pad to exact size
  const w = img.width
  const h = img.height
  if (w === width && h === height) {
    return encodeRgbPng(width, height, Buffer.from(rgba))
  }
  const out = Buffer.alloc(width * height * 4, 255)
  const copyW = Math.min(w, width)
  const copyH = Math.min(h, height)
  const ox = Math.floor((width - copyW) / 2)
  const oy = Math.floor((height - copyH) / 2)
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      const si = (y * w + x) * 4
      const di = ((y + oy) * width + (x + ox)) * 4
      out[di] = rgba[si]
      out[di + 1] = rgba[si + 1]
      out[di + 2] = rgba[si + 2]
      out[di + 3] = 255
    }
  }
  return encodeRgbPng(width, height, out)
}

function logoMarkDataUri() {
  const svg = readFileSync(join(publicDir, "exur-logo-brand.svg"), "utf8")
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

function storeIconSvg(size) {
  // Canonical badge: white disc + gradient mark (same as site favicon).
  const dark = readFileSync(join(publicDir, "exur-logo-dark.svg"), "utf8")
  return dark
    .replace(/width="69"/, `width="${size}"`)
    .replace(/height="69"/, `height="${size}"`)
}

function screenshotSidePanel() {
  const logo = logoMarkDataUri()
  const W = 1280
  const H = 800
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="45%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- browser chrome -->
  <rect x="48" y="40" width="1184" height="720" rx="20" fill="#FFFFFF" filter="url(#soft)"/>
  <rect x="48" y="40" width="1184" height="52" rx="20" fill="#F8FAFC"/>
  <rect x="48" y="72" width="1184" height="20" fill="#F8FAFC"/>
  <circle cx="78" cy="66" r="6" fill="#FCA5A5"/>
  <circle cx="98" cy="66" r="6" fill="#FCD34D"/>
  <circle cx="118" cy="66" r="6" fill="#86EFAC"/>
  <rect x="160" y="54" width="420" height="24" rx="12" fill="#E2E8F0"/>
  <text x="180" y="71" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" fill="#64748B">chat.exur.ai</text>

  <!-- page content stub -->
  <rect x="72" y="116" width="720" height="620" rx="16" fill="#F1F5F9"/>
  <text x="104" y="168" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-weight="600" fill="#0F172A">Market desk</text>
  <text x="104" y="204" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" fill="#64748B">Headlines and context stay open while you chat.</text>
  <rect x="104" y="240" width="640" height="88" rx="14" fill="#FFFFFF"/>
  <rect x="104" y="348" width="640" height="88" rx="14" fill="#FFFFFF"/>
  <rect x="104" y="456" width="640" height="88" rx="14" fill="#FFFFFF"/>

  <!-- side panel -->
  <rect x="820" y="100" width="388" height="636" rx="18" fill="#FAFBFC" stroke="#E2E8F0"/>
  <rect x="820" y="100" width="388" height="64" rx="18" fill="#FFFFFF"/>
  <rect x="820" y="148" width="388" height="16" fill="#FFFFFF"/>
  <image href="${logo}" x="844" y="118" width="28" height="28"/>
  <text x="882" y="138" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="#0F172A">Exur</text>
  <text x="1140" y="138" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748B">Side panel</text>

  <!-- messages -->
  <rect x="844" y="188" width="260" height="56" rx="16" fill="#2563EB"/>
  <text x="862" y="214" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#FFFFFF">What’s the read on ETH tonight?</text>
  <text x="862" y="232" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" fill="#DBEAFE">You · just now</text>

  <rect x="844" y="262" width="340" height="120" rx="16" fill="#FFFFFF" stroke="#E2E8F0"/>
  <text x="862" y="292" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="600" fill="#0F172A">Exur</text>
  <text x="862" y="318" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">Bias is cautious near resistance.</text>
  <text x="862" y="340" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">Watch liquidity and headline tone</text>
  <text x="862" y="362" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">before sizing any idea.</text>

  <rect x="844" y="404" width="200" height="36" rx="18" fill="#EFF6FF"/>
  <text x="862" y="427" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#1D4ED8">Map key levels</text>
  <rect x="1056" y="404" width="128" height="36" rx="18" fill="#EFF6FF"/>
  <text x="1072" y="427" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#1D4ED8">News bias</text>

  <!-- composer -->
  <rect x="844" y="660" width="340" height="52" rx="26" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="868" y="692" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#94A3B8">Ask Exur about this market…</text>
  <circle cx="1156" cy="686" r="16" fill="#2563EB"/>

  <text x="72" y="760" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#64748B">Exur Chat — AI co-pilot in your Chrome side panel</text>
</svg>`
}

function screenshotLogin() {
  const logo = logoMarkDataUri()
  const W = 1280
  const H = 800
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hero" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#FAFBFC"/>
      <stop offset="100%" stop-color="#E8EEF7"/>
    </linearGradient>
    <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="36" flood-color="#0F172A" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#hero)"/>
  <circle cx="220" cy="180" r="160" fill="#2563EB" opacity="0.06"/>
  <circle cx="1100" cy="620" r="200" fill="#2563EB" opacity="0.05"/>

  <image href="${logo}" x="72" y="56" width="40" height="40"/>
  <text x="124" y="84" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" fill="#0F172A">Exur</text>

  <text x="640" y="210" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="600" letter-spacing="2" fill="#64748B">SECURE SIGN-IN WITH GOOGLE</text>
  <text x="640" y="262" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="40" font-weight="700" fill="#0F172A">Continue with Google</text>
  <text x="640" y="300" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" fill="#64748B">Accept the terms below to sign in securely.</text>

  <rect x="420" y="340" width="440" height="360" rx="24" fill="#FFFFFF" fill-opacity="0.86" filter="url(#cardShadow)"/>
  <image href="${logo}" x="448" y="368" width="36" height="36"/>
  <text x="498" y="386" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="#0F172A">Exur</text>
  <text x="498" y="406" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748B">Secure sign-in with Google</text>

  <rect x="448" y="432" width="384" height="48" rx="16" fill="#F8FAFC"/>
  <text x="468" y="461" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#0F172A">I agree to the Terms of Service</text>
  <rect x="784" y="444" width="36" height="22" rx="11" fill="#2563EB"/>
  <circle cx="810" cy="455" r="8" fill="#FFFFFF"/>

  <rect x="448" y="492" width="384" height="48" rx="16" fill="#F8FAFC"/>
  <text x="468" y="521" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#0F172A">I agree to the Privacy Policy</text>
  <rect x="784" y="504" width="36" height="22" rx="11" fill="#2563EB"/>
  <circle cx="810" cy="515" r="8" fill="#FFFFFF"/>

  <rect x="448" y="568" width="384" height="48" rx="24" fill="#2563EB"/>
  <text x="640" y="598" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Agree &amp; continue with Google</text>
  <rect x="448" y="628" width="384" height="48" rx="24" fill="#DBEAFE"/>
  <text x="640" y="658" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="600" fill="#1D4ED8">Cancel</text>
</svg>`
}

function screenshotAskAnywhere() {
  const logo = logoMarkDataUri()
  const W = 1280
  const H = 800
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0B1220"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#1E293B" opacity="0.35"/>
  <!-- faux trading page -->
  <text x="72" y="88" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">BTC / USD</text>
  <text x="72" y="122" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#94A3B8">68,420.15  ·  +1.8%</text>
  <polyline points="72,420 160,380 240,400 320,300 420,320 520,220 640,260 760,180 880,210 1000,140 1120,170 1208,120" fill="none" stroke="#38BDF8" stroke-width="3"/>
  <polyline points="72,480 200,460 340,470 500,430 680,450 860,400 1040,410 1208,360" fill="none" stroke="#64748B" stroke-width="2" opacity="0.7"/>

  <!-- floating panel -->
  <rect x="780" y="80" width="440" height="640" rx="22" fill="#FAFBFC"/>
  <image href="${logo}" x="808" y="108" width="32" height="32"/>
  <text x="852" y="130" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="700" fill="#0F172A">Ask without leaving</text>
  <text x="808" y="168" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#64748B">Keep the chart open. Exur stays in the side panel.</text>

  <rect x="808" y="200" width="384" height="72" rx="16" fill="#2563EB"/>
  <text x="828" y="232" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#FFFFFF">Summarize tonight’s BTC setup</text>
  <text x="828" y="254" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#DBEAFE">from structure and recent news</text>

  <rect x="808" y="292" width="384" height="140" rx="16" fill="#FFFFFF" stroke="#E2E8F0"/>
  <text x="828" y="324" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="600" fill="#0F172A">Clear next step</text>
  <text x="828" y="352" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">Price is pressing a prior high. Prefer</text>
  <text x="828" y="374" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">confirmation over chasing — analysis only,</text>
  <text x="828" y="396" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#334155">not financial advice.</text>

  <rect x="808" y="460" width="384" height="44" rx="22" fill="#EFF6FF"/>
  <text x="828" y="488" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#1D4ED8">Nearest support &amp; resistance</text>
  <rect x="808" y="520" width="384" height="44" rx="22" fill="#EFF6FF"/>
  <text x="828" y="548" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#1D4ED8">Headline stance</text>

  <rect x="808" y="640" width="384" height="52" rx="26" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="832" y="672" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#94A3B8">Ask Exur…</text>
</svg>`
}

/**
 * CWS promo tiles — real product phones + brand copy.
 * No install CTAs / status badges (Red Nickel): free, premium, recommended, #1, new, Add/Open to Chrome, etc.
 */
function smallPromo() {
  const logo = logoMarkDataUri()
  const chatPhone = chatPhoneCleanDataUri()
  // Phone card sits on the right; image is scaled so the UI fills the frame.
  const px = 236
  const py = 18
  const pw = 178
  const ph = 292
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="#0B1220"/>
      <stop offset="55%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <filter id="phoneSh" x="-40%" y="-20%" width="180%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#020617" flood-opacity="0.5"/>
    </filter>
    <clipPath id="phoneClip">
      <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="26"/>
    </clipPath>
  </defs>
  <rect width="440" height="280" fill="url(#g)"/>
  <circle cx="390" cy="20" r="100" fill="#93C5FD" opacity="0.14"/>
  <circle cx="40" cy="250" r="80" fill="#60A5FA" opacity="0.1"/>

  <image href="${logo}" x="28" y="34" width="34" height="34"/>
  <text x="72" y="57" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">Exur</text>
  <text x="28" y="116" font-family="ui-sans-serif, system-ui, sans-serif" font-size="21" font-weight="700" fill="#FFFFFF">Ask markets.</text>
  <text x="28" y="146" font-family="ui-sans-serif, system-ui, sans-serif" font-size="21" font-weight="700" fill="#BFDBFE">Get a clear</text>
  <text x="28" y="176" font-family="ui-sans-serif, system-ui, sans-serif" font-size="21" font-weight="700" fill="#BFDBFE">next step.</text>
  <text x="28" y="228" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#DBEAFE">AI co-pilot in the side panel</text>

  <!-- Device chrome -->
  <rect x="${px - 5}" y="${py - 5}" width="${pw + 10}" height="${ph + 10}" rx="30" fill="#0F172A" filter="url(#phoneSh)"/>
  <g clip-path="url(#phoneClip)">
    <image href="${chatPhone}" x="${px - 8}" y="${py - 14}" width="${pw + 16}" height="${(pw + 16) * (700 / 372)}"/>
  </g>
</svg>`
}

function marqueePromo() {
  const logo = logoMarkDataUri()
  const signalPhone = pngFileDataUri(ensurePhoneCrop("screenshot-3-signal"))
  const newsPhone = pngFileDataUri(ensurePhoneCrop("screenshot-4-news"))
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="560" viewBox="0 0 1400 560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="40%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
    <filter id="phoneSh" x="-25%" y="-15%" width="150%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="32" flood-color="#0F172A" flood-opacity="0.22"/>
    </filter>
    <clipPath id="phoneA">
      <rect x="760" y="36" width="292" height="520" rx="36"/>
    </clipPath>
    <clipPath id="phoneB">
      <rect x="1040" y="56" width="292" height="520" rx="36"/>
    </clipPath>
  </defs>
  <rect width="1400" height="560" fill="url(#mg)"/>
  <circle cx="1180" cy="80" r="200" fill="#2563EB" opacity="0.08"/>
  <circle cx="160" cy="500" r="160" fill="#2563EB" opacity="0.06"/>

  <image href="${logo}" x="88" y="96" width="56" height="56"/>
  <text x="158" y="132" font-family="ui-sans-serif, system-ui, sans-serif" font-size="36" font-weight="700" fill="#0F172A">Exur</text>
  <text x="158" y="164" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" fill="#64748B">AI financial assistant for Chrome.</text>

  <text x="88" y="260" font-family="ui-sans-serif, system-ui, sans-serif" font-size="48" font-weight="700" fill="#0F172A">Market news,</text>
  <text x="88" y="318" font-family="ui-sans-serif, system-ui, sans-serif" font-size="48" font-weight="700" fill="#0F172A">clear answers.</text>
  <text x="88" y="380" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#475569">Ask in plain language. Signal cards when the read is clear.</text>
  <text x="88" y="410" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#475569">Stay on the page — analysis only, not financial advice.</text>

  <!-- Back phone (news), then front phone (signal) for depth -->
  <rect x="1035" y="51" width="302" height="530" rx="40" fill="#0F172A" filter="url(#phoneSh)"/>
  <g clip-path="url(#phoneB)">
    <image href="${newsPhone}" x="1040" y="40" width="292" height="550"/>
  </g>
  <rect x="755" y="31" width="302" height="530" rx="40" fill="#0F172A" filter="url(#phoneSh)"/>
  <g clip-path="url(#phoneA)">
    <image href="${signalPhone}" x="760" y="20" width="292" height="550"/>
  </g>
</svg>`
}

const jobs = [
  { file: "store-icon-128.png", svg: storeIconSvg(128), w: 128, h: 128 },
  { file: "screenshot-1-side-panel.png", svg: screenshotSidePanel(), w: 1280, h: 800 },
  { file: "screenshot-2-sign-in.png", svg: screenshotLogin(), w: 1280, h: 800 },
  { file: "screenshot-3-ask-anywhere.png", svg: screenshotAskAnywhere(), w: 1280, h: 800 },
  { file: "small-promo-440x280.png", svg: smallPromo(), w: 440, h: 280 },
  { file: "marquee-promo-1400x560.png", svg: marqueePromo(), w: 1400, h: 560 },
]

for (const job of jobs) {
  const png = renderSvgToRgbPng(job.svg, job.w, job.h)
  const path = join(outDir, job.file)
  writeFileSync(path, png)
  console.log("wrote", job.file, png.length, `${job.w}x${job.h}`)
}

writeFileSync(
  join(outDir, "README.md"),
  `# Chrome Web Store assets

Opaque 24-bit PNGs (no alpha) for the listing form.

| File | Upload as | Size |
|---|---|---|
| \`store-icon-128.png\` | Store icon | 128×128 |
| \`screenshot-1-landing.png\` … \`screenshot-4-news.png\` | Screenshots (prefer these) | 1280×800 |
| \`small-promo-440x280.png\` | Small promo tile | 440×280 · generator |
| \`marquee-promo-1400x560.png\` | Marquee promo tile | 1400×560 · generator |

**Promo tiles** (\`small-promo\`, \`marquee-promo\`) are composed by \`scripts/generate-store-assets.mjs\` from live phone crops of \`screenshot-2-chat\`, \`screenshot-3-signal\`, and \`screenshot-4-news\` (chat plan chip painted out) — brand copy only, no install CTAs.

CWS Red Nickel: do **not** put badge/CTA text in promo images (\`free\`, \`premium\`, \`recommended\`, \`#1\`, \`new\`, \`Add to Chrome\`, \`Open in Chrome\`, etc.).

Legacy mock screenshots (\`screenshot-*-side-panel|sign-in|ask-anywhere.png\`) may still be regenerated by the script — prefer the \`screenshot-1-landing\` … \`screenshot-4-news\` set for the listing.

Regenerate promo + icon + legacy mocks:

\`\`\`bash
pnpm --filter @exur/extension store-assets
\`\`\`
`
)

console.log("\nAll assets in", outDir)
