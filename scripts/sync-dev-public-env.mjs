#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const devVarsPath = join(root, ".dev.vars")
const envLocalPath = join(root, ".env.local")

if (!existsSync(devVarsPath)) {
  process.exit(0)
}

/** @type {Record<string, string>} */
const fromDev = {}
for (const line of readFileSync(devVarsPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const separator = trimmed.indexOf("=")
  if (separator === -1) continue
  const key = trimmed.slice(0, separator).trim()
  const value = trimmed.slice(separator + 1).trim()
  if (key.startsWith("NEXT_PUBLIC_") && value) {
    fromDev[key] = value
  }
}

if (Object.keys(fromDev).length === 0) {
  process.exit(0)
}

const existingLines = existsSync(envLocalPath)
  ? readFileSync(envLocalPath, "utf8").split(/\r?\n/)
  : []

/** @type {Map<string, string>} */
const merged = new Map()
let changed = false

for (const line of existingLines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const separator = trimmed.indexOf("=")
  if (separator === -1) continue
  const key = trimmed.slice(0, separator).trim()
  const value = trimmed.slice(separator + 1).trim()
  if (key) merged.set(key, value)
}

for (const [key, value] of Object.entries(fromDev)) {
  if (merged.get(key) !== value) {
    merged.set(key, value)
    changed = true
  }
}

if (!changed && existsSync(envLocalPath)) {
  process.exit(0)
}

const header = [
  "# Auto-synced from .dev.vars by scripts/sync-dev-public-env.mjs",
  "# Do not commit — .env.local is gitignored.",
  "",
]
const body = [...merged.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)

writeFileSync(envLocalPath, `${header.join("\n")}${body.join("\n")}\n`, "utf8")

for (const key of Object.keys(fromDev)) {
  console.log(`[iris] synced ${key} from .dev.vars → .env.local`)
}
