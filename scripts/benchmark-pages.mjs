#!/usr/bin/env node
/**
 * Exur performance gate — server TTFB for landing, desk, chat assets, legal.
 *
 * Usage:
 *   node scripts/benchmark-pages.mjs [baseUrl]
 *   pnpm benchmark:pages
 *
 * Env:
 *   PERF_STRICT=1 — fail if warm budgets are missed (default on)
 *   PERF_BUDGET_MS=1500 — max warm TTFB for critical routes in dev
 *
 * Default: https://local.exur.ai:3000
 */

import { spawnSync } from "node:child_process"

const BASE = (process.argv[2] ?? "https://local.exur.ai:3000").replace(/\/$/, "")
const STRICT = process.env.PERF_STRICT !== "0"
/** Dev Turbopack is slower than production — keep budgets realistic but failing on regression. */
const BUDGET_MS = Number(process.env.PERF_BUDGET_MS ?? 2500)
const CRITICAL = new Set([
  "Landing (/home local)",
  "Desk chat (/)",
  "Desk news (?tab=news)",
  "About",
  "Favicon",
  "Manifest",
  "OG image",
])

const ROUTES = [
  { path: "/home", label: "Landing (/home local)", critical: true },
  { path: "/", label: "Desk chat (/)", critical: true },
  { path: "/?tab=news", label: "Desk news (?tab=news)", critical: true },
  { path: "/about", label: "About", critical: true },
  { path: "/ai-trading-signals", label: "AI Signals SEO", critical: false },
  { path: "/privacy", label: "Privacy", critical: false },
  { path: "/terms", label: "Terms", critical: false },
  { path: "/upgrade", label: "Upgrade", critical: false },
  { path: "/billing", label: "Billing", critical: false },
  { path: "/auth/success", label: "Auth success", critical: false },
  { path: "/ar/home", label: "Landing AR local", critical: false },
  { path: "/opengraph-image", label: "OG image", critical: true },
  { path: "/twitter-image", label: "Twitter image", critical: false },
  { path: "/favicon.ico", label: "Favicon", critical: true },
  { path: "/manifest.webmanifest", label: "Manifest", critical: true },
  { path: "/exur-logo-light.svg", label: "Logo SVG", critical: false },
]

function measure(url) {
  const args = [
    "-skL",
    "--max-time",
    "60",
    "-o",
    "NUL",
    "-w",
    "%{http_code} %{time_total} %{size_download}",
    url,
  ]
  const result = spawnSync("curl.exe", args, { encoding: "utf8" })
  if (result.status !== 0) {
    const fallback = spawnSync("curl", args, {
      encoding: "utf8",
      shell: true,
    })
    if (fallback.status !== 0) {
      return {
        error: (result.stderr || fallback.stderr || "curl failed").trim(),
        status: 0,
        totalMs: Number.POSITIVE_INFINITY,
        bytes: 0,
      }
    }
    return parseCurl(fallback.stdout)
  }
  return parseCurl(result.stdout)
}

function parseCurl(stdout) {
  const [status, seconds, bytes] = String(stdout).trim().split(/\s+/)
  return {
    status: Number(status),
    totalMs: Number(seconds) * 1000,
    bytes: Number(bytes),
  }
}

function fmtMs(ms) {
  if (!Number.isFinite(ms)) return "—"
  return `${ms.toFixed(0)}ms`
}

function grade(ms) {
  if (!Number.isFinite(ms)) return "⚪"
  if (ms < 200) return "🟢"
  if (ms < 500) return "🟡"
  if (ms < 1000) return "🟠"
  return "🔴"
}

function runPass() {
  return ROUTES.map((route) => ({
    ...route,
    ...measure(`${BASE}${route.path}`),
  }))
}

console.log(`\nExur performance gate`)
console.log(`Base: ${BASE}`)
console.log(`Budget (warm critical): ${BUDGET_MS}ms · strict=${STRICT ? "on" : "off"}`)
console.log(`Time: ${new Date().toISOString()}\n`)

// Prime compile for cold-ish routes once.
for (const route of ROUTES.filter((r) => r.critical)) {
  measure(`${BASE}${route.path}`)
}
await new Promise((r) => setTimeout(r, 300))

const warm = runPass()
await new Promise((r) => setTimeout(r, 200))
const warm2 = runPass()

console.log("| Page | Warm1 | Warm2 | Size | Status | Gate |")
console.log("|------|-------|-------|------|--------|------|")

const failures = []

for (let i = 0; i < ROUTES.length; i++) {
  const a = warm[i]
  const b = warm2[i]
  const best = Math.min(a.totalMs, b.totalMs)
  const sizeKb = Number.isFinite(b.bytes) ? (b.bytes / 1024).toFixed(1) : "—"
  const okStatus = b.status >= 200 && b.status < 400
  const withinBudget = !a.critical || best <= BUDGET_MS
  const pass = okStatus && withinBudget && !b.error
  if (!pass && (a.critical || CRITICAL.has(a.label))) {
    failures.push({
      label: a.label,
      best,
      status: b.status,
      error: b.error,
    })
  }
  const gate = pass ? "PASS" : a.critical ? "FAIL" : "warn"
  console.log(
    `| ${a.label} | ${grade(a.totalMs)} ${fmtMs(a.totalMs)} | ${grade(b.totalMs)} ${fmtMs(b.totalMs)} | ${sizeKb} KB | ${b.error ? "ERR" : b.status} | ${gate} |`
  )
}

const ok = warm2.filter((r) => !r.error && r.status >= 200 && r.status < 400)
const avg =
  ok.reduce((sum, r) => sum + r.totalMs, 0) / Math.max(ok.length, 1)
const critical = warm2.filter((r) => r.critical && !r.error)
const criticalAvg =
  critical.reduce((sum, r) => sum + r.totalMs, 0) /
  Math.max(critical.length, 1)

console.log(`\nSummary:`)
console.log(`  Routes OK: ${ok.length}/${ROUTES.length}`)
console.log(`  Average warm: ${fmtMs(avg)}`)
console.log(`  Critical avg: ${fmtMs(criticalAvg)}`)

if (failures.length > 0) {
  console.log(`\nFailed critical gates:`)
  for (const f of failures) {
    console.log(
      `  - ${f.label}: ${fmtMs(f.best)} status=${f.status}${f.error ? ` (${f.error})` : ""}`
    )
  }
  if (STRICT) {
    console.log(`\nPERF GATE FAILED\n`)
    process.exit(1)
  }
  console.log(`\nPERF GATE WARN (PERF_STRICT=0)\n`)
  process.exit(0)
}

console.log(`\nPERF GATE PASSED\n`)
