/** Extract BTC/ETH from a user or expanded signal prompt. */

export type TradeSymbol = "BTC" | "ETH"

export function extractTradeSymbolFromMessage(text: string): TradeSymbol {
  const raw = text.trim()
  if (!raw) return "ETH"

  if (/\b(btc|bitcoin|xbt)\b/iu.test(raw)) return "BTC"
  if (/بیت[\s-]?کوین/u.test(raw)) return "BTC"
  if (/\b(eth|ethereum|ether)\b/iu.test(raw)) return "ETH"
  if (/اتریوم|اتر/u.test(raw)) return "ETH"

  return "ETH"
}
