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
  /^(?:\/signal|@signal|\/سیگنال|@سیگنال|\/إشارة|@إشارة|سیگنال|إشارة)(?:\s+([\s\S]*))?$/iu

const SIGNAL_SUMMARY_RE = /^(?:Signal|سیگنال|إشارة) · (.+)$/u

/** Committed inline mention token — followed by whitespace or end of string. */
const SIGNAL_INLINE_MENTION_RE = /[/@](?:signal|سیگنال|إشارة)(?=\s|$)/giu

const SIGNAL_INLINE_ASSET_RE = /[/@](?:signal|سیگنال|إشارة)\s+([^\s/@]+)/iu

export const IRIS_MENTION_OPTIONS: IrisMentionOption[] = [
  {
    id: "signal",
    tool: "signal",
    label: "Signal",
  },
]

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
 * Uses the localized label when provided (`/سیگنال ` / `/Signal `).
 */
export function mentionTokenForTool(
  tool: IrisMentionTool,
  label = "Signal"
): string {
  if (tool === "signal") {
    const trimmed = label.trim() || "Signal"
    return `${COMPOSER_MENTION_TRIGGER}${trimmed} `
  }
  return `${COMPOSER_MENTION_TRIGGER}${tool} `
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

/** Short history/UI label for signal commands so follow-ups are not re-primed. */
export function summarizeSignalUserMessage(
  text: string,
  label = "Signal"
): string {
  const trimmed = stripMarketContextAppendix(text)
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
 * Normalize drafts that contain `/signal`, `@signal`, or localized signal
 * tokens into a model-readable `@signal` wire payload.
 * Never leave raw `/Signal …` text for the model.
 */
export function expandComposerMentions(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const tagged = trimmed.match(SIGNAL_TOOL_TAG_RE)
  if (tagged) {
    return formatSignalCommand((tagged[1] ?? "").trim())
  }

  const inline = trimmed.match(SIGNAL_INLINE_ASSET_RE)
  if (inline) {
    return formatSignalCommand((inline[1] ?? "").trim())
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
 * Split composer text so committed `/Signal` / `/سیگنال` tokens can be
 * rendered bold in a mirror overlay while the textarea stays editable.
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
