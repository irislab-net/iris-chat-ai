import { existsSync } from "node:fs"
import { join } from "node:path"

import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

import { allowedDevOrigins } from "./lib/dev-access"
import { CHAT_API_ORIGIN, IRIS_API_ORIGIN } from "./lib/api/origins"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const TRADINGVIEW_LIBRARY_ENTRY = join(
  process.cwd(),
  "public/charting_library/charting_library.standalone.js"
)
const hasTradingViewLibrary = existsSync(TRADINGVIEW_LIBRARY_ENTRY)

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TRADINGVIEW_LIBRARY: hasTradingViewLibrary ? "1" : "0",
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
  // Same-origin /v1 proxy so Path=/v1/auth refresh cookies on *.irislab.info work
  async rewrites() {
    const chatOrigin = CHAT_API_ORIGIN
    if (process.env.NODE_ENV === "development") {
      console.log(`[iris] Chat API route → ${chatOrigin}`)
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
    // /v1/chat → app/v1/chat; /v1/auth, /v1/me → app route handlers (cookie proxy).
    // /v1/wallets, /v1/trading, /v1/wallet, /v1/entitlements use app route handlers too.
    return [
      {
        source:
          "/v1/:path((?!chat(?:/|$)|auth(?:/|$)|me(?:/|$)|wallets|entitlements|trading(?:/|$)|wallet(?:/|$)).*)",
        destination: `${IRIS_API_ORIGIN}/v1/:path`,
      },
    ]
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
