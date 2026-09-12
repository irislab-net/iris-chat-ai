/** @-mentions and tool tags in the IRIS chat composer. */

import { isLowSignalUserMessage } from "@/lib/co-pilot-recovery"
import { buildActionSignalPrompt } from "@/lib/iris-paper-trade/signal-prompts"

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

function normalizeMentionQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ")
}

export function buildSignalPrompt(asset: string): string {
  return buildActionSignalPrompt(asset)
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

/** Short history/UI label for expanded desk prompts so follow-ups are not re-primed. */
export function summarizeSignalUserMessage(text: string): string {
  const trimmed = text.trim()
  const en = trimmed.match(/^Trading desk request for\s+(.+?)\./u)
  if (en?.[1]) return `Signal · ${en[1].trim()}`
  const fa = trimmed.match(/^درخواست\s+میز\s+معاملاتی\s+برای\s+(.+?)\./u)
  if (fa?.[1]) return `Signal · ${fa[1].trim()}`
  return trimmed
}

export function expandComposerDraft(input: ComposerDraft): string {
  const body = input.text.trim()
  if (input.tool === "signal") {
    if (isLowSignalUserMessage(body)) return body
    return buildSignalPrompt(body)
  }
  return body
}

/**
 * Expand `@signal` tokens in the composer draft.
 * Whole-draft `@signal <asset…>` keeps a multi-word asset; mid-text uses the next token.
 */
export function expandComposerMentions(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const whole = trimmed.match(/^@signal(?:\s+([\s\S]+))?$/u)
  if (whole) {
    const asset = (whole[1] ?? "").trim()
    if (!asset || isLowSignalUserMessage(asset)) return trimmed
    return buildSignalPrompt(asset)
  }

  const inline = trimmed.match(/@signal\s+([^\s@]+)/u)
  if (inline) {
    const asset = inline[1] ?? ""
    if (isLowSignalUserMessage(asset)) return trimmed
    return buildSignalPrompt(asset)
  }

  return trimmed
}

/** Replace an `@…` palette fragment with an inline `@tool ` token. */
export function applyMentionSelection(input: {
  text: string
  replaceStart: number
  replaceEnd: number
  tool?: IrisMentionTool
}): { nextText: string; nextCursor: number } {
  const tool = input.tool ?? "signal"
  const before = input.text.slice(0, input.replaceStart)
  const after = input.text.slice(input.replaceEnd)
  const token = `@${tool} `
  const nextText = `${before}${token}${after}`
  const nextCursor = before.length + token.length
  return { nextText, nextCursor }
}

/** Insert `@tool ` at the caret so the tag lives in the message text. */
export function insertToolMentionAtCursor(input: {
  text: string
  cursor: number
  selectionEnd?: number
  tool: IrisMentionTool
}): { nextText: string; nextCursor: number } {
  const end = input.selectionEnd ?? input.cursor
  const before = input.text.slice(0, input.cursor)
  const after = input.text.slice(end)
  const token = `@${input.tool} `
  const needsSpace = before.length > 0 && !/[\s\n]$/u.test(before)
  const insertion = `${needsSpace ? " " : ""}${token}`
  const nextText = `${before}${insertion}${after}`
  const nextCursor = before.length + insertion.length
  return { nextText, nextCursor }
}

/** @deprecated Sticky chip mode removed — tags stay inline as `@signal`. */
export function parseComposerToolTag(text: string): ComposerDraft | null {
  const match = text.match(/^@signal(?:\s+([\s\S]*))?$/u)
  if (!match) return null
  return {
    tool: "signal",
    text: (match[1] ?? "").trimStart(),
  }
}
