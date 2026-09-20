import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

import { allowedDevOrigins } from "./lib/dev-access"
import { CHAT_API_ORIGIN } from "./lib/api/origins"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const TRADINGVIEW_LIBRARY_ENTRY = join(
  process.cwd(),
  "public/charting_library/charting_library.standalone.js"
)
const hasTradingViewLibrary = existsSync(TRADINGVIEW_LIBRARY_ENTRY)

function readDevVarsFile(): Record<string, string> {
  const devVarsPath = join(process.cwd(), ".dev.vars")
  if (!existsSync(devVarsPath)) return {}

  const env: Record<string, string> = {}
  for (const line of readFileSync(devVarsPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (key) env[key] = value
  }
  return env
}

/** Bridge Cloudflare `.dev.vars` into Next for NEXT_PUBLIC_* when not in production. */
function publicEnvFromDevVars(): Record<string, string> {
  if (process.env.NODE_ENV === "production") return {}

  const fromFile = readDevVarsFile()
  const merged: Record<string, string> = {}

  for (const [key, value] of Object.entries(fromFile)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue
    if (process.env[key]?.trim()) continue
    merged[key] = value
  }

  return merged
}

const devPublicEnv = publicEnvFromDevVars()

for (const [key, value] of Object.entries(devPublicEnv)) {
  process.env[key] ??= value
}

if (devPublicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  console.log(
    `[iris] Google One Tap client ID loaded from .dev.vars (${devPublicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID.slice(0, 8)}…)`
  )
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TRADINGVIEW_LIBRARY: hasTradingViewLibrary ? "1" : "0",
    ...devPublicEnv,
  },
  poweredByHeader: false,
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // /v1/* is handled by app/v1/[...path]/route.ts (Cloudflare-safe proxy dispatch).
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      console.log(`[iris] Chat API proxy → ${CHAT_API_ORIGIN}`)
      if (process.env.CHAT_API_GUEST_FALLBACK_ORIGIN) {
        console.log(
          `[iris] Guest fallback → ${process.env.CHAT_API_GUEST_FALLBACK_ORIGIN}`
        )
      }
      console.log(
        `[iris] TradingView Charting Library ${hasTradingViewLibrary ? "enabled" : "disabled (Lightweight Charts fallback)"}`
      )
      console.log("[iris] Trading API stub (paper/demo trading only)")
    }
    return []
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/upgrade",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  },
  // exur.ai plus this machine's LAN IPs so phones on the same Wi-Fi can load HMR
  allowedDevOrigins: allowedDevOrigins(),
}

export default withNextIntl(nextConfig)

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
