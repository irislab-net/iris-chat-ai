import { parseUnits } from "ethers"

/**
 * Normalize mobile / locale typing before `parseUnits`:
 * - Strip bidi marks IMEs sometimes insert
 * - Arabic-Indic & Persian digits → ASCII
 * - EU decimal comma (`10,5`) vs thousands separators (`1,000`)
 */
export function normalizeDecimalAmountInput(raw: string): string {
  let s = raw
    .trim()
    /** IME / paste often inserts ZWSP/ZWJ/ZWNJ/BOM between digits — breaks `parseUnits`. */
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
  s = s.replace(/[\u0660-\u0669]/g, c =>
    String(c.charCodeAt(0) - 0x0660)
  )
  s = s.replace(/[\u06f0-\u06f9]/g, c =>
    String(c.charCodeAt(0) - 0x06f0)
  )

  const hasDot = s.includes(".")
  if (!hasDot && /,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".")
  } else {
    s = s.replace(/,/g, "")
  }

  s = s.trim()
  /** Allow "100." while typing — ethers rejects lone trailing dot. */
  if (s.endsWith(".")) {
    s = s.slice(0, -1).trim()
  }

  return s
}

export function tryParseAmountWei(raw: string, decimals: number | null): bigint | null {
  if (decimals === null) return null
  const s = normalizeDecimalAmountInput(raw)
  if (!s) return null
  try {
    return parseUnits(s, decimals)
  } catch {
    return null
  }
}

/**
 * Live input sanitizer for staking amount fields: keeps typing/paste compatible with
 * `normalizeDecimalAmountInput` + `tryParseAmountWei` while blocking letters/symbols.
 * Preserves in-progress edits like `12.` or `.5`.
 */
export function filterStakingDecimalInput(raw: string, decimals: number | null): string {
  let s = String(raw ?? "")
    .trim()
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
  s = s.replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x0660))
  s = s.replace(/[\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - 0x06f0))

  const hasDot = s.includes(".")
  if (!hasDot && /,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".")
  } else {
    s = s.replace(/,/g, "")
  }

  s = s.replace(/[^\d.]/g, "")

  if (decimals === 0) {
    return s.replace(/\./g, "")
  }

  const maxFrac = decimals === null ? Number.POSITIVE_INFINITY : decimals

  let out = ""
  let dotSeen = false
  let fracCount = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!
    if (ch >= "0" && ch <= "9") {
      if (dotSeen && fracCount >= maxFrac) continue
      if (dotSeen) fracCount++
      out += ch
    } else if (ch === "." && !dotSeen) {
      out += "."
      dotSeen = true
    }
  }
  return out
}
