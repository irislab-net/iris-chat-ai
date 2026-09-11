#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { platform } from "node:os"

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (platform() === "win32") {
  console.warn(
    "[build] OpenNext Cloudflare bundle needs symlinks and is unreliable on Windows.",
  )
  console.warn("[build] Running `next build` instead. Use WSL or CI for deploy bundles.")
  run("pnpm", ["exec", "next", "build"])
} else {
  run("pnpm", ["exec", "opennextjs-cloudflare", "build"])
}
