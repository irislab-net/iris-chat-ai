/** Long-paste → attachment chip (ChatGPT / Gemini composer pattern). */

export type ComposerPasteAttachment = {
  id: string
  name: string
  kind: "text" | "markdown"
  content: string
  charCount: number
  lineCount: number
}

/** ~ChatGPT: multi-paragraph / long paste becomes a file chip, not inline text. */
export const PASTE_ATTACHMENT_CHAR_THRESHOLD = 1200
export const PASTE_ATTACHMENT_LINE_THRESHOLD = 16
export const PASTE_ATTACHMENT_MAX = 5

export function shouldConvertPasteToAttachment(text: string): boolean {
  const normalized = text.replace(/\r\n/g, "\n").trimEnd()
  if (!normalized.trim()) return false
  if (normalized.length >= PASTE_ATTACHMENT_CHAR_THRESHOLD) return true
  const lineCount = normalized.split("\n").length
  return (
    lineCount >= PASTE_ATTACHMENT_LINE_THRESHOLD && normalized.length >= 400
  )
}

export function detectPasteAttachmentKind(
  text: string
): ComposerPasteAttachment["kind"] {
  const sample = text.slice(0, 8000)
  let score = 0
  if (/^#{1,6}\s+\S/m.test(sample)) score += 2
  if (/```[\w-]*\n[\s\S]+?```/.test(sample)) score += 2
  if (/^\s*[-*+]\s+\S/m.test(sample) && sample.split("\n").length > 6) score += 1
  if (/^\|.+\|/m.test(sample) && sample.includes("---")) score += 2
  if (/\[[^\]]+\]\([^)]+\)/.test(sample)) score += 1
  if (/\*\*[^*\n]{2,}\*\*/.test(sample) || /__[^_\n]{2,}__/.test(sample)) {
    score += 1
  }
  return score >= 2 ? "markdown" : "text"
}

export function createPasteAttachment(
  text: string,
  existing: ComposerPasteAttachment[] = []
): ComposerPasteAttachment {
  const content = text.replace(/\r\n/g, "\n")
  const kind = detectPasteAttachmentKind(content)
  const lineCount = content.length === 0 ? 0 : content.split("\n").length
  const sameKind = existing.filter((item) => item.kind === kind).length
  const ext = kind === "markdown" ? "md" : "txt"
  const name =
    sameKind === 0 ? `pasted.${ext}` : `pasted-${sameKind + 1}.${ext}`

  return {
    id: `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    kind,
    content,
    charCount: content.length,
    lineCount,
  }
}

export function formatPasteAttachmentSize(charCount: number): string {
  if (charCount < 1024) return `${charCount} B`
  const kb = charCount / 1024
  return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
}

/**
 * Merge composer chips into the outbound user message.
 * Chips stay in the UI; on the wire we send plain content only — no
 * synthetic “please review…” prompt and no ```file="pasted.txt"``` wrapper.
 */
export function buildMessageWithPasteAttachments(
  text: string,
  attachments: ComposerPasteAttachment[],
  /** @deprecated Kept for call-site compat; unused. */
  _emptyPrompt?: string
): string {
  if (attachments.length === 0) return text.trim()

  const bodies = attachments
    .map((attachment) => attachment.content.replace(/\r\n/g, "\n").trimEnd())
    .filter(Boolean)
    .join("\n\n")

  const prompt = text.trim()
  if (prompt && bodies) return `${prompt}\n\n${bodies}`
  return prompt || bodies
}
