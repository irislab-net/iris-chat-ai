/** Strip leaked MARKET_CONTEXT / account appendices from user-visible chat text. */
export function stripMarketContextAppendix(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const markers = [
    /\n*---\s*\n+MARKET_CONTEXT\b/i,
    /\n+MARKET_CONTEXT\s*\(/i,
    /\n+MARKET_CONTEXT\b/i,
    /\n+PAPER_ACCOUNT\b/i,
    /\n+DEMO_ACCOUNT\b/i,
  ] as const

  let cut = -1
  for (const marker of markers) {
    const match = marker.exec(trimmed)
    if (match?.index != null && (cut < 0 || match.index < cut)) {
      cut = match.index
    }
  }
  if (cut < 0) return trimmed
  return trimmed.slice(0, cut).trim()
}
