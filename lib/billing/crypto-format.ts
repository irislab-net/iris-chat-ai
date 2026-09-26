/** USDT on EVM chains uses 6 decimals in invoice payloads. */
export const USDT_DECIMALS = 6

/** Display precision for stablecoin send amounts (always two places). */
const CRYPTO_DISPLAY_DECIMALS = 2

export function formatCryptoAmount(
  raw: string | number,
  currency = "USDT",
  decimals = USDT_DECIMALS
): string {
  const text = String(raw).trim()
  if (!text) return `0.${"0".repeat(CRYPTO_DISPLAY_DECIMALS)} ${currency}`

  const integerPart = text.split(".")[0]?.replace(/\D/g, "") || "0"
  const smallest = BigInt(integerPart || "0")
  const displayScale = BigInt(10 ** CRYPTO_DISPLAY_DECIMALS)
  const divisor = BigInt(10 ** decimals)
  // Round half-up into display units (e.g. cents for 2 places).
  const displayUnits = (smallest * displayScale + divisor / BigInt(2)) / divisor
  const whole = displayUnits / displayScale
  const fraction = displayUnits % displayScale

  return `${whole}.${fraction.toString().padStart(CRYPTO_DISPLAY_DECIMALS, "0")} ${currency}`
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/**
 * USD “About” figure for a stablecoin send row — use the same number the user
 * sees in the crypto amount label so the two stay in lockstep.
 */
export function aboutUsdFromCryptoLabel(
  cryptoLabel: string,
  fallbackUsd: number
): number {
  const match = cryptoLabel.trim().match(/^([\d]+(?:\.[\d]+)?)/)
  if (match) {
    const parsed = Number(match[1])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return Number.isFinite(fallbackUsd) ? fallbackUsd : 0
}
