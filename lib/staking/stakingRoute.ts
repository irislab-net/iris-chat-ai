/**
 * Staking app route helpers (locale-aware).
 * Canonical path: `/staking` (and `/[locale]/staking` when prefix is present).
 */

export function isStakingAppPathname(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/"
  if (p === "/staking" || p === "/app") return true
  // /fa/staking, /en/app, etc.
  return /\/(staking|app)$/.test(p)
}
