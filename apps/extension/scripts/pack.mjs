#!/usr/bin/env node
/**
 * Build a Chrome Web Store zip.
 * Store rejects manifest `key` (used only for stable local / unpacked ID + OAuth).
 */
import { execSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")
const staging = join(root, ".store-pack")
const outZip = join(root, "exur-chat-extension.zip")

/** Must match `EXTENSION_GOOGLE_LOGIN_APP` in src/adapters/auth.ts */
const EXTENSION_GOOGLE_LOGIN_APP = "chromimum_extension"

const env = loadEnv("production", root, "")
const googleClientId = (
  env.VITE_GOOGLE_CLIENT_ID ||
  env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  ""
).trim()

if (!googleClientId) {
  console.error(
    "Missing VITE_GOOGLE_CLIENT_ID (or NEXT_PUBLIC_GOOGLE_CLIENT_ID).\n" +
      "Set it in apps/extension/.env before packing — needed for Google Cloud Console / legacy chrome.identity."
  )
  process.exit(1)
}

console.log("Building extension…")
execSync("pnpm run build", { cwd: root, stdio: "inherit" })

if (!existsSync(join(dist, "manifest.json"))) {
  console.error("dist/manifest.json missing after build")
  process.exit(1)
}

const assetsDir = join(dist, "assets")
const assetFiles = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((name) => name.endsWith(".js"))
  : []
const assetContents = assetFiles.map((name) =>
  readFileSync(join(assetsDir, name), "utf8")
)

// Primary store sign-in is API PKCE (`app=chromimum_extension`), not chrome.identity.
// The Google client ID is only used by the unused legacy helper and is tree-shaken out.
const hasPkceAppFlag = assetContents.some((code) =>
  code.includes(EXTENSION_GOOGLE_LOGIN_APP)
)
if (!hasPkceAppFlag) {
  console.error(
    `Build is missing app=${EXTENSION_GOOGLE_LOGIN_APP} (Google PKCE login). Aborting pack.`
  )
  process.exit(1)
}

rmSync(staging, { recursive: true, force: true })
mkdirSync(staging, { recursive: true })
cpSync(dist, staging, { recursive: true })

const manifestPath = join(staging, "manifest.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
if ("key" in manifest) {
  delete manifest.key
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  console.log("Removed manifest.key for Chrome Web Store upload")
}

rmSync(outZip, { force: true })
execSync(`zip -r -q "${outZip}" .`, { cwd: staging, stdio: "inherit" })
rmSync(staging, { recursive: true, force: true })

console.log(`\nReady: ${outZip}`)
console.log(
  "Upload this zip in the Chrome Web Store dashboard (not apps/extension/dist)."
)
console.log(
  "After upload, copy the store extension ID and complete STORE_CHECKLIST.md:"
)
console.log("  https://<STORE_ID>.chromiumapp.org/")
console.log("  chrome-extension://<STORE_ID>  (api.exur.ai CORS)")
