import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { crx } from "@crxjs/vite-plugin"
import { resolve, sep } from "node:path"
import manifest from "./manifest.config"

const src = resolve(__dirname, "src")

const FEATURE_ENV_KEYS = [
  "NEXT_PUBLIC_FEATURE_SIGNAL",
  "NEXT_PUBLIC_FEATURE_CORRELATION",
  "NEXT_PUBLIC_FEATURE_VOLATILITY",
  "NEXT_PUBLIC_FEATURE_WATCHLIST",
  "NEXT_PUBLIC_FEATURE_VOICE",
] as const

function resolvePublicEnv(
  env: Record<string, string>,
  key: string
): string {
  return env[key] || process.env[key] || ""
}

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "")
  const localEnv = loadEnv(mode, __dirname, "")
  const env = { ...rootEnv, ...localEnv }
  const googleClientId =
    env.VITE_GOOGLE_CLIENT_ID ||
    env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""

  const featureDefines = Object.fromEntries(
    FEATURE_ENV_KEYS.map((key) => [
      `process.env.${key}`,
      JSON.stringify(resolvePublicEnv(env, key)),
    ])
  )

  return {
    plugins: [react(), tailwindcss(), crx({ manifest })],
    publicDir: "public",
    resolve: {
      alias: {
        "@": src,
        "next-intl": resolve(src, "shims/next-intl.tsx"),
        "next/navigation": resolve(src, "shims/next-navigation.ts"),
        "next/dynamic": resolve(src, "shims/next-dynamic.tsx"),
        "next/headers": resolve(src, "shims/next-headers.ts"),
        "next/image": resolve(src, "shims/next-image.tsx"),
        "@wrksz/themes/client/use-theme": resolve(src, "shims/use-theme.tsx"),
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV ?? "production"
      ),
      "process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID": JSON.stringify(googleClientId),
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(googleClientId),
      "process.env.NEXT_PUBLIC_APP_URL": JSON.stringify("https://chat.exur.ai"),
      "process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP_DEV": JSON.stringify(""),
      ...featureDefines,
    },
    envPrefix: ["VITE_"],
    server: {
      port: 5173,
      strictPort: true,
      hmr: { port: 5173 },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Side panel + chat UI is one chunk by design; CRX size is fine above 500 kB.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        input: {
          // Extra HTML pages (not in manifest) — consent wizard + OAuth return
          login: resolve(__dirname, "login.html"),
          callback: resolve(__dirname, "callback.html"),
        },
        onwarn(warning, warn) {
          // zod v4 ships `@__PURE__` comments Rollup cannot parse; safe to ignore.
          const id = warning.id ?? warning.loc?.file ?? ""
          const message = warning.message ?? ""
          if (
            id.includes(`${sep}zod${sep}`) ||
            message.includes("annotation that Rollup cannot interpret")
          ) {
            return
          }
          warn(warning)
        },
      },
    },
  }
})
