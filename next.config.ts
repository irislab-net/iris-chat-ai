import { existsSync } from "node:fs"
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

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TRADINGVIEW_LIBRARY: hasTradingViewLibrary ? "1" : "0",
    NEXT_PUBLIC_CHAT_API_ORIGIN:
      process.env.NEXT_PUBLIC_CHAT_API_ORIGIN?.replace(/\/$/, "") ??
      process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ??
      "",
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
      const chatClientOrigin =
        process.env.NEXT_PUBLIC_CHAT_API_ORIGIN?.replace(/\/$/, "") ??
        process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ??
        CHAT_API_ORIGIN
      console.log(`[iris] Chat API client → ${chatClientOrigin}`)
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
  // local.irislab.info plus this machine's LAN IPs so phones on the same Wi-Fi can load HMR
  allowedDevOrigins: allowedDevOrigins(),
}

export default withNextIntl(nextConfig)

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
