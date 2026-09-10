#!/usr/bin/env node
/**
 * Measure server response time for public app routes.
 * Usage: node scripts/benchmark-pages.mjs [baseUrl]
 * Default: https://localhost:3000
 */

import { spawnSync } from "node:child_process"

const BASE = (process.argv[2] ?? "https://localhost:3000").replace(/\/$/, "")

const ROUTES = [
  { path: "/", label: "Landing" },
  { path: "/app", label: "Workspace (default)" },
  { path: "/app?tab=desk", label: "Workspace · Desk" },
  { path: "/app?tab=news", label: "Workspace · News" },
  { path: "/app?tab=analysis", label: "Workspace · Analysis" },
  { path: "/about", label: "About" },
  { path: "/ai-trading-signals", label: "AI Signals SEO" },
  { path: "/privacy", label: "Privacy" },
  { path: "/terms", label: "Terms" },
  { path: "/upgrade", label: "Upgrade" },
  { path: "/auth/success", label: "Auth success" },
  { path: "/landing", label: "Legacy /landing redirect" },
]

function measure(url) {
  const args = [
    "-skL",
    "-o",
    "/dev/null",
    "-w",
    "%{http_code} %{time_total} %{size_download}",
    url,
  ]
  const result = spawnSync("curl", args, { encoding: "utf8" })
  if (result.status !== 0) {
    return {
      error: (result.stderr || result.stdout || "curl failed").trim(),
      status: 0,
      totalMs: NaN,
      bytes: 0,
    }
  }
  const [status, seconds, bytes] = result.stdout.trim().split(" ")
  return {
    status: Number(status),
    totalMs: Number(seconds) * 1000,
    bytes: Number(bytes),
  }
}

function fmtMs(ms) {
  return `${ms.toFixed(0)}ms`
}

function grade(ms) {
  if (ms < 200) return "🟢"
  if (ms < 500) return "🟡"
  if (ms < 1000) return "🟠"
  return "🔴"
}

function runPass() {
  const rows = []
  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`
    rows.push({ ...route, ...measure(url) })
  }
  return rows
}

console.log(`\nIRIS page load benchmark (server HTML)`)
console.log(`Base: ${BASE}`)
console.log(`Time: ${new Date().toISOString()}\n`)

const cold = runPass()
await new Promise((r) => setTimeout(r, 400))
const warm = runPass()

console.log("| Page | Cold | Warm | Size | Status |")
console.log("|------|------|------|------|--------|")

for (let i = 0; i < ROUTES.length; i++) {
  const c = cold[i]
  const w = warm[i]
  const sizeKb = (w.bytes / 1024).toFixed(1)
  const status = c.error ? `ERR` : String(c.status)
  console.log(
    `| ${c.label} | ${grade(c.totalMs)} ${fmtMs(c.totalMs)} | ${grade(w.totalMs)} ${fmtMs(w.totalMs)} | ${sizeKb} KB | ${status} |`
  )
}

const warmTotals = warm.filter((r) => !r.error && r.status >= 200 && r.status < 400)
if (warmTotals.length === 0) {
  console.log("\nNo successful responses. Is `pnpm dev` running?")
  process.exit(1)
}

const avgWarm = warmTotals.reduce((sum, r) => sum + r.totalMs, 0) / warmTotals.length
const slowest = [...warmTotals].sort((a, b) => b.totalMs - a.totalMs)[0]
const fastest = [...warmTotals].sort((a, b) => a.totalMs - b.totalMs)[0]

console.log(`\nSummary (warm pass, ${warmTotals.length} pages):`)
console.log(`  Average: ${fmtMs(avgWarm)}`)
console.log(`  Fastest: ${fastest.label} (${fmtMs(fastest.totalMs)})`)
console.log(`  Slowest: ${slowest.label} (${fmtMs(slowest.totalMs)})`)
console.log(
  `\nNote: measures server HTML response time via curl — not browser LCP/CLS/JS bundle.\n`
)
