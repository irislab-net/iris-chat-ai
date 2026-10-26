#!/usr/bin/env node
/**
 * Build and deploy the staging Worker (iris-chat-ai-staging).
 *
 * Next inlines NEXT_PUBLIC_* at build time, so staging vars from
 * wrangler.jsonc env.staging.vars are applied to the build environment.
 *
 *   node scripts/deploy-staging.mjs build   # build only
 *   node scripts/deploy-staging.mjs         # build, then deploy --env staging
 */
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

function parseJsonc(text) {
  const stripped = text.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*$)/gm,
    (match, comment) => (comment ? "" : match)
  )
  return JSON.parse(stripped)
}

const config = parseJsonc(readFileSync("wrangler.jsonc", "utf8"))
const stagingVars = config.env?.staging?.vars
if (!stagingVars || typeof stagingVars !== "object") {
  console.error("[deploy:staging] wrangler.jsonc is missing env.staging.vars")
  process.exit(1)
}

const buildOnly = process.argv.includes("build")

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...stagingVars,
      CI: "true",
    },
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run("pnpm", ["exec", "opennextjs-cloudflare", "build"])

if (!buildOnly) {
  run("pnpm", [
    "exec",
    "opennextjs-cloudflare",
    "deploy",
    "--env",
    "staging",
  ])
}
