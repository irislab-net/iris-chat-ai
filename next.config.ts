import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs/config"
import createNextIntlPlugin from "next-intl/plugin"

import { allowedDevOrigins } from "./lib/dev-access"
import { CHAT_API_ORIGIN } from "./lib/api/origins"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

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
    ...devPublicEnv,
  },
  poweredByHeader: false,
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  // Drop Lucide's XML namespace URI so HTML5 SVG doesn't emit http:// xmlns
  // (checklist scanners false-flag it as an HTTPS downgrade).
  turbopack: {
    resolveAlias: {
      "lucide-react/dist/esm/defaultAttributes.mjs":
        "./lib/lucide-default-attributes.mjs",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "lucide-react/dist/esm/defaultAttributes.mjs": join(
        process.cwd(),
        "lib/lucide-default-attributes.mjs"
      ),
    }
    return config
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
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "s3-symbol-logo.tradingview.com",
        pathname: "/**",
      },
    ],
  },
  // /v1/* is handled by app/v1/[...path]/route.ts (Cloudflare-safe proxy dispatch).
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[iris] Chat API proxy → ${CHAT_API_ORIGIN}`
      )
      if (process.env.CHAT_API_GUEST_FALLBACK_ORIGIN) {
        console.log(
          `[iris] Guest fallback → ${process.env.CHAT_API_GUEST_FALLBACK_ORIGIN}`
        )
      }
    }
    return []
  },
  async headers() {
    // GIS One Tap on local HTTPS needs a looser referrer than production.
    // See https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
    const referrerPolicy =
      process.env.NODE_ENV === "production"
        ? "strict-origin-when-cross-origin"
        : "no-referrer-when-downgrade"

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: referrerPolicy },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self' https:",
              "upgrade-insecure-requests",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://accounts.google.com https://apis.google.com https://browser.sentry-cdn.com https://*.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.exur.ai https://*.exur.ai https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://accounts.google.com https://*.sentry.io https://*.ingest.sentry.io wss: https:",
              "frame-src 'self' https://accounts.google.com https://www.google.com https://www.googletagmanager.com https://js.stripe.com https://buy.stripe.com",
              "worker-src 'self' blob:",
              "media-src 'self' https://files.exur.ai blob:",
            ].join("; "),
          },
        ],
      },
      {
        source: "/home",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=900, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/landing/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/exur-logo-:variant",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:locale(ar|fa|nl|pt|es|ru|tr)/home",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=900, stale-while-revalidate=86400",
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

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Upload source maps only when an auth token is present (CI/production builds).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
