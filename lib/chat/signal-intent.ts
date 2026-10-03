function compact(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

/**
 * Composer `/signal ETH` or legacy `@signal ETH` (and UI label `Signal · ETH`)
 * — chat API + client `show_trade_signal`.
 */
export function isSignalMentionCommand(text: string): boolean {
  const raw = compact(text)
  if (!raw) return false
  if (
    /^(?:\/signal|@signal|\/سیگنال|@سیگنال|\/إشارة|@إشارة|سیگنال|إشارة)(?:\s+\S.*)?$/iu.test(
      raw
    )
  )
    return true
  if (/^(?:Signal|سیگنال|إشارة) · .+$/u.test(raw)) return true
  return false
}

/**
 * User turns that own a trade-signal card (keep / strip tickets on history).
 * Does not route a local trading engine — signals come from `show_trade_signal`.
 */
export function isTradeSignalRequest(text: string): boolean {
  const raw = compact(text)
  if (!raw) return false
  if (isSignalMentionCommand(raw)) return true
  if (/\bshow_trade_signal\b/i.test(raw)) return true

  const lower = raw.toLowerCase()
  const asksSignal =
    /trade\s*signal/.test(lower) ||
    (/سیگنال|signal/i.test(raw) &&
      /(eth|ethereum|اتریوم|btc|bitcoin|بیت|trade|معامله|ترید)/i.test(raw))

  return asksSignal
}
