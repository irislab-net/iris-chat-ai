import { formatUnits } from "ethers"

const SCALE_1E8 = 10n ** 8n
const HALF_ETH_WEI = 10n ** 17n

/**
 * Formats wei as ETH for UI: fixed decimal (max 8 places), never scientific notation,
 * trailing zeros trimmed. Dust rounds to zero display uses precise decimal trim.
 */
export function formatFeeEtherDisplay(wei: bigint): string {
  if (wei === 0n) return "0"

  const roundedTimes1e8 = (wei * SCALE_1E8 + HALF_ETH_WEI) / 10n ** 18n

  if (roundedTimes1e8 === 0n && wei > 0n) {
    return trimDecimalString(formatUnits(wei, 18), 12)
  }

  const whole = roundedTimes1e8 / SCALE_1E8
  const fracRaw = (roundedTimes1e8 % SCALE_1E8).toString().padStart(8, "0")
  const frac = fracRaw.replace(/0+$/, "")
  return frac ? `${whole}.${frac}` : `${whole}`
}

function trimDecimalString(s: string, maxFracDigits: number): string {
  const t = s.trim()
  const sign = t.startsWith("-") ? "-" : ""
  const body = sign ? t.slice(1) : t
  const [intPart, frac = ""] = body.split(".")
  const ft = frac.slice(0, maxFracDigits).replace(/0+$/, "")
  if (!ft) return `${sign}${intPart}`
  return `${sign}${intPart}.${ft}`
}
