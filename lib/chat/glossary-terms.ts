/**
 * Plain-language glossary for institutional trading terms shown in chat UI.
 * Keys are matched case-insensitively; longer phrases win over shorter ones.
 */

export const GLOSSARY_TERMS = {
  VWAP: "Volume Weighted Average Price — the average price weighted by how much traded at each level.",
  ATR: "Average True Range — a measure of how much price typically moves, used to size stops and targets.",
  "Order Block":
    "A zone where institutions previously bought or sold heavily, often acting as support or resistance.",
  "Liquidity Pool":
    "A cluster of stop-losses or pending orders that price often sweeps before reversing.",
  "Funding Rate":
    "The periodic fee between long and short positions on perpetual futures that keeps price near spot.",
  Beta: "How much an asset tends to move relative to the broader market (1 ≈ moves with the market).",
  Leverage:
    "Borrowed size that amplifies both gains and losses relative to your own capital.",
  "Reward Risk":
    "How much you stand to gain versus how much you risk if the stop is hit.",
  "Stop Loss":
    "The price level where the trade is closed to limit further loss if the idea fails.",
  "Take Profit":
    "The price level where the trade is closed to lock in gains if the idea works.",
} as const

export type GlossaryTerm = keyof typeof GLOSSARY_TERMS

/** Longest-first so “Order Block” beats a bare “Order” if we add one later. */
export const GLOSSARY_TERM_KEYS = (
  Object.keys(GLOSSARY_TERMS) as GlossaryTerm[]
).sort((a, b) => b.length - a.length)

const glossaryLookup = new Map(
  GLOSSARY_TERM_KEYS.map((key) => [key.toLowerCase(), key] as const)
)

/** Escape a glossary key for use inside a RegExp character class / pattern. */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Word-boundary aware pattern. Multi-word keys allow flexible whitespace.
 * Built once and reused.
 */
export const GLOSSARY_TERM_PATTERN = new RegExp(
  `\\b(?:${GLOSSARY_TERM_KEYS.map((key) =>
    escapeRegExp(key).replace(/\\s+/g, "\\s+")
  ).join("|")})\\b`,
  "gi"
)

export type GlossarySegment =
  | { type: "text"; value: string }
  | { type: "term"; value: string; term: GlossaryTerm; definition: string }

export function resolveGlossaryTerm(matched: string): GlossaryTerm | null {
  const key = glossaryLookup.get(matched.toLowerCase().replace(/\s+/g, " "))
  return key ?? null
}

/** Split prose into plain text and glossary term segments (safe for React keys). */
export function splitGlossarySegments(text: string): GlossarySegment[] {
  if (!text) return []

  const segments: GlossarySegment[] = []
  const pattern = new RegExp(
    GLOSSARY_TERM_PATTERN.source,
    GLOSSARY_TERM_PATTERN.flags
  )
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const value = match[0]
    const start = match.index
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) })
    }
    const term = resolveGlossaryTerm(value)
    if (term) {
      segments.push({
        type: "term",
        value,
        term,
        definition: GLOSSARY_TERMS[term],
      })
    } else {
      segments.push({ type: "text", value })
    }
    lastIndex = start + value.length
    // Avoid zero-length loops if a bad pattern ever matches empty.
    if (value.length === 0) pattern.lastIndex += 1
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) })
  }

  return segments
}
