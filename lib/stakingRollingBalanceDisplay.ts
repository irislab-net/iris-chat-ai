const SECONDS_PER_YEAR = 365.25 * 24 * 3600

/**
 * Rolling staked balance display is NOT real-time on-chain balance. It is time-based
 * interpolation between `last_processed_at` and `next_profit_share_at`: `rawProgress`
 * follows wall clock in that window. UI smoothing (elsewhere) applies only to the
 * smoothed base toward chain `targetBase` (plus snap rules); never smooth `rawProgress`.
 */

export function parseIsoMs(iso: string): number | null {
  if (!iso || typeof iso !== "string") return null
  const ms = Date.parse(iso.trim())
  return Number.isFinite(ms) ? ms : null
}

export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x
}

export type RollingStakedDisplayInput = {
  baseFloat: number
  apyPercentage: number
  shareIntervalSeconds: number
  lastProcessedAtIso: string
  nextProfitShareAtIso: string
  serverTimeMs: number
  /**
   * When both are finite and `windowNextMs > windowLastMs`, used for progress math
   * instead of parsing ISO strings (settlement grace hotfix).
   */
  windowLastMs?: number
  windowNextMs?: number
}

/** Grace after committed `nextMs` while chain principal is unchanged (rolling settlement hotfix). */
export const SETTLEMENT_GRACE_MS = 120_000

export type RollingBalanceCommittedWindow = {
  lastIso: string
  nextIso: string
  lastMs: number
  nextMs: number
  stableWei: bigint
}

/**
 * Defer committing a new profit-manager window until `principalWei` changes or grace expires,
 * by extending the previous window's end. Prevents rawProgress snapping to ~0 on stale chain reads.
 */
export function resolveRollingWindowWithGrace(params: {
  committed: RollingBalanceCommittedWindow | null
  profitLastIso: string
  profitNextIso: string
  apiLastMs: number | null
  apiNextMs: number | null
  principalWei: bigint
  serverTimeMs: number
  graceMs: number
}): {
  windowLastMs: number | null
  windowNextMs: number | null
  snapSmoothedBase: boolean
  /** When set, replace committed window ref after applying this frame. */
  nextCommitted: RollingBalanceCommittedWindow | undefined
} {
  const {
    committed,
    profitLastIso,
    profitNextIso,
    apiLastMs,
    apiNextMs,
    principalWei,
    serverTimeMs,
    graceMs,
  } = params

  const validApi =
    apiLastMs !== null &&
    apiNextMs !== null &&
    Number.isFinite(apiLastMs) &&
    Number.isFinite(apiNextMs) &&
    apiNextMs > apiLastMs

  if (!validApi) {
    return {
      windowLastMs: null,
      windowNextMs: null,
      snapSmoothedBase: false,
      nextCommitted: undefined,
    }
  }

  if (committed === null) {
    return {
      windowLastMs: apiLastMs,
      windowNextMs: apiNextMs,
      snapSmoothedBase: true,
      nextCommitted: {
        lastIso: profitLastIso,
        nextIso: profitNextIso,
        lastMs: apiLastMs,
        nextMs: apiNextMs,
        stableWei: principalWei,
      },
    }
  }

  const sameIso =
    profitLastIso === committed.lastIso &&
    profitNextIso === committed.nextIso

  if (sameIso) {
    return {
      windowLastMs: apiLastMs,
      windowNextMs: apiNextMs,
      snapSmoothedBase: false,
      nextCommitted:
        principalWei !== committed.stableWei
          ? {
              ...committed,
              stableWei: principalWei,
            }
          : undefined,
    }
  }

  if (principalWei !== committed.stableWei) {
    return {
      windowLastMs: apiLastMs,
      windowNextMs: apiNextMs,
      snapSmoothedBase: true,
      nextCommitted: {
        lastIso: profitLastIso,
        nextIso: profitNextIso,
        lastMs: apiLastMs,
        nextMs: apiNextMs,
        stableWei: principalWei,
      },
    }
  }

  const graceEnd = committed.nextMs + graceMs
  if (serverTimeMs > graceEnd) {
    return {
      windowLastMs: apiLastMs,
      windowNextMs: apiNextMs,
      snapSmoothedBase: true,
      nextCommitted: {
        lastIso: profitLastIso,
        nextIso: profitNextIso,
        lastMs: apiLastMs,
        nextMs: apiNextMs,
        stableWei: principalWei,
      },
    }
  }

  return {
    windowLastMs: committed.lastMs,
    windowNextMs: committed.nextMs + graceMs,
    snapSmoothedBase: false,
    nextCommitted: undefined,
  }
}

export type RollingStakedModel = {
  /** On-chain / vault principal in token float units (same as input `baseFloat`). */
  targetBase: number
  /** Per-period rate from APY and share interval (unchanged economics). */
  rPeriod: number
  /** Clamped time progress in [last, next]; never smoothed in the animation layer. */
  rawProgress: number
  /** True when the profit window or interval math cannot drive accrual (show base only). */
  degenerate: boolean
}

export function computeRollingStakedModel(
  input: RollingStakedDisplayInput
): RollingStakedModel {
  const {
    baseFloat: targetBase,
    apyPercentage,
    shareIntervalSeconds,
    lastProcessedAtIso,
    nextProfitShareAtIso,
    serverTimeMs,
  } = input

  if (!Number.isFinite(targetBase) || targetBase < 0) {
    return { targetBase: 0, rPeriod: 0, rawProgress: 0, degenerate: true }
  }
  if (!Number.isFinite(serverTimeMs)) {
    return { targetBase, rPeriod: 0, rawProgress: 0, degenerate: true }
  }

  let lastMs: number | null
  let nextMs: number | null
  const wL = input.windowLastMs
  const wN = input.windowNextMs
  if (
    typeof wL === "number" &&
    typeof wN === "number" &&
    Number.isFinite(wL) &&
    Number.isFinite(wN) &&
    wN > wL
  ) {
    lastMs = wL
    nextMs = wN
  } else {
    lastMs = parseIsoMs(lastProcessedAtIso)
    nextMs = parseIsoMs(nextProfitShareAtIso)
  }
  if (lastMs === null || nextMs === null || nextMs <= lastMs) {
    return { targetBase, rPeriod: 0, rawProgress: 0, degenerate: true }
  }

  const durationMs = nextMs - lastMs
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return { targetBase, rPeriod: 0, rawProgress: 0, degenerate: true }
  }

  const intervalSec = shareIntervalSeconds
  if (!Number.isFinite(intervalSec) || intervalSec <= 0) {
    return { targetBase, rPeriod: 0, rawProgress: 0, degenerate: true }
  }

  const periodsPerYear = SECONDS_PER_YEAR / intervalSec
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    return { targetBase, rPeriod: 0, rawProgress: 0, degenerate: true }
  }

  const apy = apyPercentage / 100
  const rPeriod =
    !Number.isFinite(apy) || apy <= 0 ? 0 : Math.pow(1 + apy, 1 / periodsPerYear) - 1

  const cappedTime = Math.min(Math.max(serverTimeMs, lastMs), nextMs)
  const rawProgress = clamp01((cappedTime - lastMs) / durationMs)

  return { targetBase, rPeriod, rawProgress, degenerate: false }
}

/**
 * Non-animated reference: exact chain-base interpolation (reduced motion / sanity).
 */
export function computeRollingStakedDisplayFloat(
  input: RollingStakedDisplayInput
): number {
  const model = computeRollingStakedModel(input)
  if (model.degenerate) return model.targetBase

  const { targetBase, rPeriod, rawProgress } = model
  const periodProfit = targetBase * rPeriod
  if (!Number.isFinite(periodProfit) || periodProfit < 0) return targetBase

  const display = targetBase + rawProgress * periodProfit
  const ceiling = targetBase + periodProfit
  const out = Math.min(display, ceiling)
  if (!Number.isFinite(out) || out < 0) return targetBase
  return out
}

/** Epsilon for React `setDisplayFloat` — must track `displayDecimals` (UI), not raw token decimals only. */
export function rollingRenderEpsilon(displayDecimals: number): number {
  const d = Math.max(0, Math.floor(displayDecimals))
  return Math.max(1e-12, 10 ** -(d + 2))
}
