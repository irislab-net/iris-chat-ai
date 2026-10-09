import { ZeroAddress, getAddress, isAddress } from "ethers"

/** Valid checksummed affiliate, or null if missing / invalid / zero address. */
export function normalizeStakingReferralAddress(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!isAddress(trimmed)) return null
  try {
    const addr = getAddress(trimmed)
    if (addr === ZeroAddress) return null
    return addr
  } catch {
    return null
  }
}
