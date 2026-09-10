export function formatPaperPrice(price: number): string {
  if (!Number.isFinite(price)) return "—"
  const abs = Math.abs(price)
  const digits = abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 1 ? 4 : 6
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}
