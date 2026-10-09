// Phase D3a extracted runtime plane composition

export function normalizeStakingVaultChainId(
  chainId: number | string | bigint | null | undefined
): number | null {
  if (chainId === undefined || chainId === null) return null
  if (typeof chainId === "bigint") {
    const n = Number(chainId)
    return Number.isFinite(n) ? n : null
  }
  if (typeof chainId === "number") {
    return Number.isFinite(chainId) ? chainId : null
  }
  const t = chainId.trim()
  if (!t) return null
  if (/^0x[0-9a-f]+$/i.test(t)) {
    const n = Number.parseInt(t, 16)
    return Number.isFinite(n) ? n : null
  }
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}
