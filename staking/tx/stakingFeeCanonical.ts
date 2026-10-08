/**
 * Canonical fee snapshot for staking tx modal: keep preview / submit / success
 * aligned on the same maximum network or protocol fee (wei-safe).
 */

function parsePositiveWeiHex(hex: string | null | undefined): bigint | null {
  if (hex == null || typeof hex !== "string") return null
  const t = hex.trim().toLowerCase()
  if (!t || t === "0x" || t === "0x0") return null
  try {
    const n = BigInt(t.startsWith("0x") ? t : `0x${t}`)
    return n >= 0n ? n : null
  } catch {
    return null
  }
}

export type StakingFeeCanonicalPair = {
  maxWeiHex: string | null
  displayLine: string
}

export function emptyStakingFeeCanonicalPair(): StakingFeeCanonicalPair {
  return { maxWeiHex: null, displayLine: "" }
}

/**
 * Prefer the strictly larger wei bucket; on tie or missing wei, prefer non-empty
 * displayLine, then longer line (stable UX when wei matches).
 */
export function mergeStakingFeeCanonicalPair(
  prev: StakingFeeCanonicalPair,
  next: StakingFeeCanonicalPair
): StakingFeeCanonicalPair {
  const pWei = parsePositiveWeiHex(prev.maxWeiHex)
  const nWei = parsePositiveWeiHex(next.maxWeiHex)
  const pD = prev.displayLine.trim()
  const nD = next.displayLine.trim()

  if (pWei !== null && nWei !== null) {
    if (nWei > pWei) {
      return {
        maxWeiHex: next.maxWeiHex,
        displayLine: nD !== "" ? next.displayLine : prev.displayLine,
      }
    }
    if (pWei > nWei) {
      return prev
    }
  } else if (nWei !== null && pWei === null) {
    return {
      maxWeiHex: next.maxWeiHex,
      displayLine: nD !== "" ? next.displayLine : prev.displayLine,
    }
  } else if (pWei !== null && nWei === null) {
    return prev
  }

  if (nD !== "" && pD === "") return next
  if (pD !== "" && nD === "") return prev
  if (nD.length > pD.length) return next
  return prev
}

export function resolveSuccessFeeDisplayLine(input: {
  committed: StakingFeeCanonicalPair
  fallbackLine: string
}): string {
  const merged = mergeStakingFeeCanonicalPair(input.committed, {
    maxWeiHex: null,
    displayLine: input.fallbackLine,
  })
  const t = merged.displayLine.trim()
  return t !== "" ? merged.displayLine : input.fallbackLine
}
