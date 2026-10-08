/**
 * DEV-only integrity checks for staking tx lifecycle (concise, deduped).
 *
 * Guardrail rationale:
 * - docs/staking-runtime-contracts.md
 * - docs/staking-runtime-edgecases.md
 * - docs/staking-domain-boundaries.md
 */
import { stakingLifecycleTrace } from "@/staking/diagnostics/stakingLifecycleInstrumentation"

const recent = new Map<string, number>()
const DEDupe_MS = 4000

function shouldEmit(key: string): boolean {
  const now = Date.now()
  const prev = recent.get(key)
  if (prev !== undefined && now - prev < DEDupe_MS) return false
  recent.set(key, now)
  if (recent.size > 64) {
    const cutoff = now - DEDupe_MS * 4
    for (const [k, t] of recent) {
      if (t < cutoff) recent.delete(k)
    }
  }
  return true
}

export function stakingTxIntegrityDev(
  event: string,
  detail?: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const key = `${event}:${JSON.stringify(detail ?? {})}`
  if (!shouldEmit(key)) return
  stakingLifecycleTrace("integrity", event, detail)
}
