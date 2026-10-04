/** Slash-triggered tool mentions in the IRIS chat composer. */

import { stripMarketContextAppendix } from "@/lib/chat/strip-market-context"

export type IrisMentionTool = "signal"

export type IrisMentionOption = {
  id: string
  tool: IrisMentionTool
  /** English fallback — UI should prefer i18n `composerToolSignalLabel`. */
  label: string
}

export type MentionPaletteState = {
  query: string
  replaceStart: number
  replaceEnd: number
}

export type ComposerDraft = {
  tool: IrisMentionTool | null
  text: string
}

export type ComposerMentionHighlightPart =
  | { type: "text"; value: string }
  | { type: "mention"; value: string }

/** Character that opens the tool suggestion palette. */
export const COMPOSER_MENTION_TRIGGER = "/"

/** Local aliases for signal tool drafts (typed, sample prompts, or inline mentions). */
const SIGNAL_TOOL_TAG_RE =
  /^(?:\/signal|@signal|signal|\/سیگنال|@سیگنال|سیگنال|\/إشارة|@إشارة|إشارة)(?:\s+([\s\S]*))?$/iu

const SIGNAL_SUMMARY_RE = /^(?:Signal|سیگنال|إشارة) · (.+)$/u

/**
 * Committed inline mention token — followed by whitespace or end of string.
 * Slash/`@` forms stay supported for typed/legacy text; menu insert is bare.
 */
const SIGNAL_INLINE_MENTION_RE =
  /(?:[/@](?:signal|سیگنال|إشارة)|(?<![/@\p{L}\p{N}_])(?:signal|سیگنال|إشارة))(?=\s|$)/giu

export const IRIS_MENTION_OPTIONS: IrisMentionOption[] = [
  {
    id: "signal",
    tool: "signal",
    label: "Signal",
  },
]

/** `/` palette rows — insertable mentions + locked premium tools. */
export type ComposerPaletteToolId = "signal" | "correlation" | "volatility"

export type ComposerPaletteTool = {
  id: ComposerPaletteToolId
  /** Present when the row inserts an inline mention token. */
  mention?: IrisMentionOption
  locked?: boolean
}

export const COMPOSER_PALETTE_TOOLS: ComposerPaletteTool[] = [
  { id: "signal", mention: IRIS_MENTION_OPTIONS[0] },
  { id: "correlation", locked: true },
  { id: "volatility", locked: true },
]

const COMPOSER_PALETTE_ALIASES: Record<ComposerPaletteToolId, string> = {
  signal: "signal trade setup سیگنال إشارة",
  correlation: "correlation asset correlate همبستگی مرتبط",
  volatility: "volatility forecast oscillate نوسان پیش‌بینی",
}

export type ComposerPaletteLabels = Record<ComposerPaletteToolId, string>

export function findIrisMentionOption(
  tool: IrisMentionTool
): IrisMentionOption | undefined {
  return IRIS_MENTION_OPTIONS.find((option) => option.tool === tool)
}

function normalizeMentionQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ")
}

/**
 * True when the text after `/Signal` looks like a compact market target
 * (`ETH`, `اتریوم`) rather than free-form prose (`میخوام`).
 */
export function isCompactSignalTarget(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 32 || /\n/.test(trimmed)) return false
  // Intent / filler words — expand these into an explicit wire prompt.
  if (
    /(?:میخوام|می‌خوام|ميخوام|بده|بدهید|لطفا|خواهش|please|want|need|give|signal|سیگنال|إشارة|\bfor\b|\bme\b|\ba\b|\bthe\b)/i.test(
      trimmed
    )
  ) {
    return false
  }
  if (!/\s/.test(trimmed)) return true
  const parts = trimmed.split(/\s+/)
  if (parts.length > 3) return false
  return parts.every((part) => /^[\p{L}\p{N}.\-/\$%]+$/u.test(part))
}

const SIGNAL_WIRE_INSTRUCTIONS = [
  "Treat this as a trade-signal tool request (/Signal), not general chat.",
  "Resolve the asset from the user request or conversation context; ask which market if unclear.",
  "When a setup is clear, call show_trade_signal; otherwise explain why to wait.",
].join(" ")

/**
 * Wire payload the model sees. Compact targets stay `@signal ETH`.
 * Free-form text (e.g. `/Signal میخوام`) gets an explicit signal intent
 * so the model does not treat `/Signal` as opaque UI chrome.
 */
export function formatSignalCommand(asset: string): string {
  const trimmed = asset.trim()
  if (!trimmed) {
    return `@signal\n${SIGNAL_WIRE_INSTRUCTIONS}`
  }
  if (isCompactSignalTarget(trimmed)) {
    return `@signal ${trimmed}`
  }
  return `@signal ${trimmed}\n${SIGNAL_WIRE_INSTRUCTIONS}`
}

/** @deprecated Prefer formatSignalCommand — kept as an alias for call sites/tests. */
export function buildSignalPrompt(asset: string): string {
  return formatSignalCommand(asset)
}

/**
 * Inline token inserted when the user picks a tool from the `/` menu.
 * Slash opens the palette; the committed token is bare label text
 * (`سیگنال ` / `Signal `) so `/` is not shown after selection.
 */
export function mentionTokenForTool(
  tool: IrisMentionTool,
  label = "Signal"
): string {
  if (tool === "signal") {
    const trimmed = label.trim() || "Signal"
    return `${trimmed} `
  }
  return `${tool} `
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Rewrite pasted/typed `/signal btc`, `@Signal ETH`, `/سیگنال …` into the
 * bare UI mention (`Signal BTC`) so the slash trigger is not left visible.
 * Does not rewrite an in-progress `/sig…` query (needs trailing whitespace,
 * or a whole-string bare token with no following text).
 */
export function normalizeComposerSignalMentions(
  text: string,
  label = "Signal"
): string {
  if (!text) return text
  const nextLabel = label.trim() || "Signal"

  let next = text
    // `/signal …` / `@سیگنال …` → bare label (keep the following text)
    .replace(
      /(^|[\s])[/@](signal|سیگنال|إشارة)(?=\s)/giu,
      `$1${nextLabel}`
    )
    // Whole-string `/signal` / `@signal` with no asset yet
    .replace(/^[/@](signal|سیگنال|إشارة)$/iu, nextLabel)

  // Uppercase compact Latin tickers right after the committed label.
  const tickerRe = new RegExp(
    `(^|[\\s])(${escapeRegExp(nextLabel)})(\\s+)([a-z0-9][a-z0-9.-]{0,15})(?=\\s|$)`,
    "g"
  )
  next = next.replace(tickerRe, (full, pre, lbl, ws, asset: string) => {
    if (!/^[a-z0-9.-]+$/i.test(asset)) return full
    if (asset === asset.toUpperCase()) return full
    return `${pre}${lbl}${ws}${asset.toUpperCase()}`
  })

  return next
}

/** Map a caret index through {@link normalizeComposerSignalMentions}. */
export function mapCursorThroughSignalNormalize(
  text: string,
  cursor: number,
  label = "Signal"
): number {
  const safeCursor = Math.max(0, Math.min(cursor, text.length))
  const normalizedPrefix = normalizeComposerSignalMentions(
    text.slice(0, safeCursor),
    label
  )
  const normalized = normalizeComposerSignalMentions(text, label)
  return Math.min(normalizedPrefix.length, normalized.length)
}

/** Active `/query` at cursor, if any. */
export function parseMentionPalette(
  text: string,
  cursor: number
): MentionPaletteState | null {
  const before = text.slice(0, cursor)
  const trigger = before.lastIndexOf(COMPOSER_MENTION_TRIGGER)
  if (trigger < 0) return null

  const fragment = before.slice(trigger + 1)
  // Whitespace ends the query session (Slack-style) so a committed
  // `/Signal ETH` caret does not keep the suggestion menu open.
  if (/[\n\r\s]/.test(fragment)) return null
  if (fragment.length > 0 && !/^[\w\u0600-\u06FF.-]*$/u.test(fragment)) {
    return null
  }

  const charBefore = trigger > 0 ? before[trigger - 1] : " "
  if (charBefore !== " " && charBefore !== "\n" && trigger !== 0) return null

  return {
    query: fragment,
    replaceStart: trigger,
    replaceEnd: cursor,
  }
}

export function filterMentionOptions(query: string): IrisMentionOption[] {
  const key = normalizeMentionQuery(query)
  if (!key) return IRIS_MENTION_OPTIONS

  return IRIS_MENTION_OPTIONS.filter((option) => {
    const haystack = normalizeMentionQuery(
      `${option.tool} ${option.label} signal سیگنال إشارة`
    )
    return key.split(" ").every((part) => haystack.includes(part))
  })
}

/** Filter `/` sheet rows by typed query + localized titles. */
export function filterComposerPaletteTools(
  query: string,
  labels: ComposerPaletteLabels
): ComposerPaletteTool[] {
  const key = normalizeMentionQuery(query)
  if (!key) return COMPOSER_PALETTE_TOOLS

  return COMPOSER_PALETTE_TOOLS.filter((tool) => {
    const haystack = normalizeMentionQuery(
      `${tool.id} ${labels[tool.id]} ${COMPOSER_PALETTE_ALIASES[tool.id]}`
    )
    return key.split(" ").every((part) => haystack.includes(part))
  })
}

/**
 * First-strong direction for the composer textarea + mention mirror.
 * Matches HTML `dir="auto"` / `unicode-bidi: plaintext` — do NOT special-case
 * `/Signal`, or mixed FA+EN lines force LTR and the caret floats away from text.
 */
export function composerInputDirection(
  text: string,
  fallback: "ltr" | "rtl"
): "ltr" | "rtl" {
  if (!text) return fallback

  for (const char of text) {
    if (isRtlScriptChar(char)) return "rtl"
    if (isLtrScriptChar(char)) return "ltr"
  }
  return fallback
}

/**
 * True when the draft has both RTL and LTR letters.
 * Transparent-textarea + highlight-mirror cannot keep the caret aligned in
 * that case (ChatGPT/Gemini avoid it via ProseMirror/Quill chip nodes).
 */
export function composerHasMixedBidiScripts(text: string): boolean {
  let hasRtl = false
  let hasLtr = false
  for (const char of text) {
    if (isRtlScriptChar(char)) hasRtl = true
    else if (isLtrScriptChar(char)) hasLtr = true
    if (hasRtl && hasLtr) return true
  }
  return false
}

function isRtlScriptChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return (
    (code >= 0x0590 && code <= 0x08ff) ||
    (code >= 0xfb1d && code <= 0xfdfd) ||
    (code >= 0xfe70 && code <= 0xfefc)
  )
}

function isLtrScriptChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return (
    (code >= 0x0041 && code <= 0x005a) ||
    (code >= 0x0061 && code <= 0x007a) ||
    (code >= 0x00c0 && code <= 0x024f)
  )
}

/** Short history/UI label for signal commands so follow-ups are not re-primed. */
export function summarizeSignalUserMessage(
  text: string,
  label = "Signal"
): string {
  const trimmed = stripMarketContextAppendix(text)
  if (SIGNAL_SUMMARY_RE.test(trimmed)) return trimmed
  const mention = trimmed.match(SIGNAL_TOOL_TAG_RE)
  if (mention) {
    // Wire prompts may append instruction lines after the user target.
    const asset = (mention[1] ?? "").trim().split(/\n/, 1)[0]?.trim() ?? ""
    return asset ? `${label} · ${asset}` : label
  }
  // Legacy desk prompts still stored in older threads.
  const en = trimmed.match(/^Trading desk request for\s+(.+?)\./u)
  if (en?.[1]) return `${label} · ${en[1].trim()}`
  const fa = trimmed.match(/^درخواست\s+میز\s+معاملاتی\s+برای\s+(.+?)\./u)
  if (fa?.[1]) return `${label} · ${fa[1].trim()}`
  return trimmed
}

/** Re-expand a summarized signal label back into the @signal chat payload. */
export function expandSummarizedSignalUserMessage(text: string): string {
  const trimmed = text.trim()
  const summarized = trimmed.match(SIGNAL_SUMMARY_RE)
  if (summarized?.[1]) return formatSignalCommand(summarized[1].trim())
  return trimmed
}

export function expandComposerDraft(input: ComposerDraft): string {
  const body = input.text.trim()
  if (input.tool === "signal") {
    return formatSignalCommand(body)
  }
  return body
}

/**
 * Normalize tool-first drafts (`/signal ETH`, `@signal`, bare UI `Signal ETH`,
 * localized `سیگنال` / `إشارة`) into a model-readable `@signal` wire payload.
 *
 * Casual chat that merely mentions “signal” / «سیگنال» mid-sentence is left
 * alone — only an intentional tool tag at the start of the message expands.
 */
export function expandComposerMentions(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const tagged = trimmed.match(SIGNAL_TOOL_TAG_RE)
  if (tagged) {
    return formatSignalCommand((tagged[1] ?? "").trim())
  }

  return trimmed
}

/** Replace the active `/query` range with an inline mention token. */
export function applyMentionSelection(input: {
  text: string
  replaceStart: number
  replaceEnd: number
  token: string
}): { nextText: string; nextCursor: number } {
  const before = input.text.slice(0, input.replaceStart)
  const after = input.text.slice(input.replaceEnd)
  const nextText = `${before}${input.token}${after}`
  const nextCursor = before.length + input.token.length
  return { nextText, nextCursor }
}

/**
 * Split composer text so committed `Signal` / `سیگنال` tokens (and legacy
 * `/Signal`) can be rendered in a mirror overlay while the textarea stays editable.
 */
export function splitComposerMentionHighlights(
  text: string
): ComposerMentionHighlightPart[] {
  if (!text) return []

  const parts: ComposerMentionHighlightPart[] = []
  let lastIndex = 0
  const pattern = new RegExp(
    SIGNAL_INLINE_MENTION_RE.source,
    SIGNAL_INLINE_MENTION_RE.flags
  )

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) })
    }
    parts.push({ type: "mention", value: match[0] ?? "" })
    lastIndex = index + (match[0]?.length ?? 0)
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) })
  }

  return parts
}

/**
 * @deprecated Chip drafts are no longer used — inline `/signal` text stays in
 * the textarea. Kept for older call sites/tests that still parse tagged prompts.
 */
export function parseComposerToolTag(text: string): ComposerDraft | null {
  const match = text.match(SIGNAL_TOOL_TAG_RE)
  if (!match) return null
  return {
    tool: "signal",
    text: (match[1] ?? "").trimStart(),
  }
}
