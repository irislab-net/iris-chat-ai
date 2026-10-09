import { DEBUG_LOGS } from "@/staking/config"
import { logger } from "@/lib/logger"

/**
 * Stable, shallow fingerprint for staking CTA debug payloads (DEV / VITE_DEBUG_LOGS).
 * Avoids JSON.stringify reorder surprises; supports bigint.
 */
export function stakingCtaStableKey(record: Record<string, unknown>): string {
  return Object.keys(record)
    .sort()
    .map(k => {
      const v = record[k]
      if (typeof v === "bigint") return `${k}:n:${v.toString()}`
      if (v === null || v === undefined) return `${k}:u:${String(v)}`
      if (typeof v === "object") {
        try {
          return `${k}:o:${JSON.stringify(v)}`
        } catch {
          return `${k}:o:[unserializable]`
        }
      }
      return `${k}:${typeof v}:${String(v)}`
    })
    .join("|")
}

/** Emit only when fingerprint changes (dedupes render-loop spam). */
export function stakingCtaLogIfChanged(
  lastFingerprintRef: { current: string },
  record: Record<string, unknown>,
  emit: (payload: Record<string, unknown>) => void
): void {
  if (!DEBUG_LOGS) return
  const fp = stakingCtaStableKey(record)
  if (fp === lastFingerprintRef.current) return
  lastFingerprintRef.current = fp
  emit(record)
}

/** Dedupe `[CTA BLOCKED BY]` while the same gate remains active. */
export function stakingCtaWarnBlockedIfChanged(
  lastCodeRef: { current: string | null },
  code: string
): void {
  if (!DEBUG_LOGS) return
  if (lastCodeRef.current === code) return
  lastCodeRef.current = code
  logger.warn("[CTA BLOCKED BY]", code)
}

/** Call when leaving all “blocked” branches (e.g. submit becomes available). */
export function stakingCtaClearBlockedCode(lastCodeRef: {
  current: string | null
}): void {
  lastCodeRef.current = null
}
