/**
 * Plain API / Firestore reward amounts: display as human decimals without
 * wei inference, `parseUnits`, or `formatUnits`.
 */

const PLAIN_DECIMAL = /^-?\d+(?:\.\d+)?$/

function trimTrailingFracZeros(s: string): string {
  if (!s.includes(".")) return s
  return s.replace(/\.?0+$/, "") || "0"
}

/** Strips grouping commas; does not validate semantics beyond trimming. */
export function normalizePlainDecimalInput(raw: string): string {
  return raw.trim().replace(/,/g, "")
}

/**
 * Returns a display string for JSON/API numeric fields (tx history, rewards).
 * Preserves common integer strings; trims unnecessary trailing zeros in fractions.
 */
export function formatPlainApiAmount(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "bigint") return raw.toString()
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null
    if (Object.is(raw, -0) || raw === 0) return "0"
    if (Number.isInteger(raw)) return String(raw)
    let s = String(raw)
    if (/e/i.test(s)) {
      const abs = Math.abs(raw)
      const sign = raw < 0 ? "-" : ""
      const maxFrac = 24
      const fracDigits = Math.min(
        maxFrac,
        Math.max(0, -Math.floor(Math.log10(abs)) + maxFrac)
      )
      s = abs.toFixed(fracDigits)
      s = trimTrailingFracZeros(s)
      return sign + s
    }
    return trimTrailingFracZeros(s)
  }
  if (typeof raw === "string") {
    const t = normalizePlainDecimalInput(raw)
    if (!t) return null
    if (!PLAIN_DECIMAL.test(t)) return null
    if (!t.includes(".")) return t
    const neg = t.startsWith("-")
    const u = neg ? t.slice(1) : t
    const trimmed = trimTrailingFracZeros(u)
    return neg && trimmed !== "0" ? `-${trimmed}` : trimmed
  }
  return null
}

/**
 * Caps fractional digits (truncates toward zero); trims trailing zeros after cap.
 * Integer part unchanged; values without `.` pass through.
 */
export function capPlainDecimalFractionDigits(
  display: string,
  maxFractionDigits: number
): string {
  if (maxFractionDigits < 0) return display
  const neg = display.startsWith("-")
  const u = neg ? display.slice(1) : display
  if (!u.includes(".")) return display
  const [intPart, fracPart = ""] = u.split(".")
  if (fracPart.length <= maxFractionDigits) return display
  const capped = fracPart.slice(0, maxFractionDigits)
  const trimmed = trimTrailingFracZeros(`${intPart}.${capped}`)
  return neg && trimmed !== "0" ? `-${trimmed}` : trimmed
}

export function isPlainAmountNonZeroDisplay(s: string | null): boolean {
  if (!s || s === "—") return false
  const t = normalizePlainDecimalInput(s)
  if (!t || t === "0" || t === "-0") return false
  const n = Number(t)
  return Number.isFinite(n) && n !== 0
}
