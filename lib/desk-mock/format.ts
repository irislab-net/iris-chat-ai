export function formatUsd(
  value: number,
  opts?: { signed?: boolean; digits?: number }
): string {
  const digits = opts?.digits ?? 2
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  if (opts?.signed) {
    if (value > 0) return `+$${abs}`
    if (value < 0) return `−$${abs}`
    return `$${abs}`
  }
  return value < 0 ? `−$${abs}` : `$${abs}`
}

export function formatPrice(value: number, instrument?: string): string {
  const key = instrument?.toUpperCase()
  let digits = 2
  if (key === "BTC") digits = 0
  else if (value >= 1000) digits = 2
  else if (value >= 1) digits = 2
  else if (value >= 0.01) digits = 4
  else digits = 8
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(digits, 2),
    maximumFractionDigits: digits,
  })
}

export function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPct(value: number, signed = true): string {
  const abs = Math.abs(value).toFixed(2)
  if (!signed) return `${abs}%`
  if (value > 0) return `+${abs}%`
  if (value < 0) return `−${abs}%`
  return `${abs}%`
}

/** Hyperliquid hourly funding rate → display percent (e.g. 0.0000125 → +0.0013%). */
export function formatFundingRate(rate: number): string {
  if (!Number.isFinite(rate)) return "—"
  const pct = rate * 100
  const abs = Math.abs(pct)
  const digits = abs >= 0.01 ? 4 : 6
  const body = abs.toFixed(digits)
  if (rate > 0) return `+${body}%`
  if (rate < 0) return `−${body}%`
  return `${body}%`
}

export function formatRoe(pnl: number, margin: number): string {
  if (!margin) return "—"
  return formatPct((pnl / margin) * 100)
}

export function formatLeverage(leverage: number | null | undefined): string {
  if (leverage == null || !Number.isFinite(leverage) || leverage <= 0) {
    return "—"
  }
  const rounded =
    leverage >= 10 ? Math.round(leverage) : Math.round(leverage * 10) / 10
  return `${rounded}×`
}

export function pnlToneClass(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  if (value < 0) return "text-rose-600 dark:text-rose-400"
  return ""
}
