#!/usr/bin/env node
/**
 * Build a Chrome Web Store zip.
 * Store rejects manifest `key` (used only for stable local / unpacked ID + OAuth).
 */
import { execSync } from "node:child_process"
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")
const staging = join(root, ".store-pack")
const outZip = join(root, "exur-chat-extension.zip")

console.log("Building extension…")
execSync("pnpm run build", { cwd: root, stdio: "inherit" })

if (!existsSync(join(dist, "manifest.json"))) {
  console.error("dist/manifest.json missing after build")
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
  "After first publish, copy the store extension ID and add redirect URI:"
)
console.log("  https://<STORE_ID>.chromiumapp.org/")
