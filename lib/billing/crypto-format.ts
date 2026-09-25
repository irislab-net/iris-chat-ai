/** USDT on EVM chains uses 6 decimals in invoice payloads. */
export const USDT_DECIMALS = 6

export function formatCryptoAmount(
  raw: string | number,
  currency = "USDT",
  decimals = USDT_DECIMALS
): string {
  const text = String(raw).trim()
  if (!text) return `0 ${currency}`

  const integerPart = text.split(".")[0]?.replace(/\D/g, "") || "0"
  const smallest = BigInt(integerPart || "0")
  const divisor = BigInt(10 ** decimals)
  const whole = smallest / divisor
  const fraction = smallest % divisor

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")

  const formatted = fractionText ? `${whole}.${fractionText}` : whole.toString()
  return `${formatted} ${currency}`
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
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
