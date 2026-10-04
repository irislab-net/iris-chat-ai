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

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")
const staging = join(root, ".store-pack")
const outZip = join(root, "exur-chat-extension.zip")

/** Must match `EXTENSION_GOOGLE_LOGIN_APP` in src/adapters/auth.ts */
const EXTENSION_GOOGLE_LOGIN_APP = "chromimum_extension"

/** Permissions that must never ship (CWS Purple Potassium — unused / future-proofing). */
const FORBIDDEN_PERMISSIONS = ["identity", "tabs", "activeTab", "scripting"]

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

// Primary store sign-in is API PKCE (`app=chromimum_extension`).
const hasPkceAppFlag = assetContents.some((code) =>
  code.includes(EXTENSION_GOOGLE_LOGIN_APP)
)
if (!hasPkceAppFlag) {
  console.error(
    `Build is missing app=${EXTENSION_GOOGLE_LOGIN_APP} (Google PKCE login). Aborting pack.`
  )
  process.exit(1)
}

if (assetContents.some((code) => code.includes("chrome.identity"))) {
  console.error(
    "Build still references chrome.identity — remove unused identity code before packing (Purple Potassium)."
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

const perms = [
  ...(manifest.permissions ?? []),
  ...(manifest.optional_permissions ?? []),
]
const forbidden = FORBIDDEN_PERMISSIONS.filter((p) => perms.includes(p))
if (forbidden.length) {
  console.error(
    `Manifest requests unused/forbidden permission(s): ${forbidden.join(", ")}`
  )
  process.exit(1)
}

const hosts = manifest.host_permissions ?? []
const allowedHosts = new Set([
  "https://api.exur.ai/*",
  "https://chat.exur.ai/*",
])
const unexpectedHosts = hosts.filter((h) => !allowedHosts.has(h))
if (unexpectedHosts.length) {
  console.error(
    `Unexpected host_permissions (justify or remove): ${unexpectedHosts.join(", ")}`
  )
  process.exit(1)
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")

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
console.log("  chrome-extension://<STORE_ID>  (api.exur.ai CORS)")
