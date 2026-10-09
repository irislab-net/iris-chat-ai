/** Right column: strip a leading `Label: ` prefix (row shows label separately). */
export function networkFeeRowRightDisplayValue(raw: string): string {
  const t = raw.trim()
  const m = /^[^:]+:\s*(.+)$/s.exec(t)
  if (m) return m[1].trim()
  return t
}
