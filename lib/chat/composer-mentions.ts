/** @-mentions and tool tags in the IRIS chat composer. */

import { isLowSignalUserMessage } from "@/lib/co-pilot-recovery"
import { stripMarketContextAppendix } from "@/lib/iris-paper-trade/prompt"

export type IrisMentionTool = "signal"

export type IrisMentionOption = {
  id: string
  tool: IrisMentionTool
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

/** Exact chat payload for a signal request — backend gathers market data. */
export function formatSignalCommand(asset: string): string {
  const trimmed = asset.trim()
  if (!trimmed) return "@signal"
  return `@signal ${trimmed}`
}

/** @deprecated Prefer formatSignalCommand — kept as an alias for call sites/tests. */
export function buildSignalPrompt(asset: string): string {
  return formatSignalCommand(asset)
}

/** Active @-query at cursor, if any. */
export function parseMentionPalette(
  text: string,
  cursor: number
): MentionPaletteState | null {
  const before = text.slice(0, cursor)
  const at = before.lastIndexOf("@")
  if (at < 0) return null

  const fragment = before.slice(at + 1)
  if (/[\n\r]/.test(fragment)) return null
  if (fragment.length > 0 && !/^[\w\u0600-\u06FF\s.-]*$/u.test(fragment)) {
    return null
  }

  const charBefore = at > 0 ? before[at - 1] : " "
  if (charBefore !== " " && charBefore !== "\n" && at !== 0) return null

  return {
    query: fragment,
    replaceStart: at,
    replaceEnd: cursor,
  }
}

export function filterMentionOptions(query: string): IrisMentionOption[] {
  const key = normalizeMentionQuery(query)
  if (!key) return IRIS_MENTION_OPTIONS

  return IRIS_MENTION_OPTIONS.filter((option) => {
    const haystack = normalizeMentionQuery(`${option.tool} ${option.label}`)
    return key.split(" ").every((part) => haystack.includes(part))
  })
}

/** Expand tool tag + user text before send. */

/** Short history/UI label for signal commands so follow-ups are not re-primed. */
export function summarizeSignalUserMessage(text: string): string {
  const trimmed = stripMarketContextAppendix(text)
  const mention = trimmed.match(/^@signal\s+(.+)$/u)
  if (mention?.[1]) return `Signal · ${mention[1].trim()}`
  // Legacy desk prompts still stored in older threads.
  const en = trimmed.match(/^Trading desk request for\s+(.+?)\./u)
  if (en?.[1]) return `Signal · ${en[1].trim()}`
  const fa = trimmed.match(/^درخواست\s+میز\s+معاملاتی\s+برای\s+(.+?)\./u)
  if (fa?.[1]) return `Signal · ${fa[1].trim()}`
  return trimmed
}

/** Re-expand a summarized signal label back into the @signal chat payload. */
export function expandSummarizedSignalUserMessage(text: string): string {
  const trimmed = text.trim()
  const summarized = trimmed.match(/^Signal · (.+)$/u)
  if (summarized?.[1]) return formatSignalCommand(summarized[1].trim())
  return trimmed
}

export function expandComposerDraft(input: ComposerDraft): string {
  const body = input.text.trim()
  if (input.tool === "signal") {
    if (isLowSignalUserMessage(body)) return body
    return formatSignalCommand(body)
  }
  return body
}

/** Legacy/plain-text expansion for drafts that still contain @signal tokens. */
export function expandComposerMentions(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const inline = trimmed.match(/@signal\s+([^\s@]+)/u)
  if (inline) {
    const asset = inline[1] ?? ""
    if (isLowSignalUserMessage(asset)) return trimmed
    return formatSignalCommand(asset)
  }

  return trimmed
}

export function applyMentionSelection(input: {
  text: string
  replaceStart: number
  replaceEnd: number
}): { nextText: string; nextCursor: number } {
  const before = input.text.slice(0, input.replaceStart)
  const after = input.text.slice(input.replaceEnd)
  const nextText = `${before}${after}`
  const nextCursor = before.length
  return { nextText, nextCursor }
}

/** Convert a typed `@signal …` draft into chip + continuation text. */
export function parseComposerToolTag(text: string): ComposerDraft | null {
  const match = text.match(/^@signal(?:\s+([\s\S]*))?$/u)
  if (!match) return null
  return {
    tool: "signal",
    text: (match[1] ?? "").trimStart(),
  }
}
