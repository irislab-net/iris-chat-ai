import { describe, expect, it } from "vitest"

import {
  buildMessageWithPasteAttachments,
  createPasteAttachment,
  detectPasteAttachmentKind,
  shouldConvertPasteToAttachment,
} from "@/lib/chat/composer-paste-attachment"

describe("shouldConvertPasteToAttachment", () => {
  it("keeps short pastes inline", () => {
    expect(shouldConvertPasteToAttachment("ETH setup please")).toBe(false)
  })

  it("converts long character pastes", () => {
    expect(shouldConvertPasteToAttachment("x".repeat(1200))).toBe(true)
  })

  it("converts multi-line pastes over the line threshold", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i} content here`).join(
      "\n"
    )
    expect(shouldConvertPasteToAttachment(lines)).toBe(true)
  })
})

describe("detectPasteAttachmentKind", () => {
  it("detects markdown", () => {
    expect(
      detectPasteAttachmentKind("# Title\n\n```ts\nconst x = 1\n```\n")
    ).toBe("markdown")
  })

  it("defaults to text", () => {
    expect(detectPasteAttachmentKind("plain paragraph without markup")).toBe(
      "text"
    )
  })
})

describe("createPasteAttachment / buildMessageWithPasteAttachments", () => {
  it("names files and embeds them for send", () => {
    const first = createPasteAttachment("a".repeat(1300))
    const second = createPasteAttachment("# H\n\n```\ncode\n```\n", [first])
    expect(first.name).toBe("pasted.txt")
    expect(second.name).toBe("pasted.md")

    const message = buildMessageWithPasteAttachments(
      "Summarize",
      [first, second],
      "Please review the attached file."
    )
    expect(message.startsWith("Summarize\n\n")).toBe(true)
    expect(message).toContain(first.content.trimEnd())
    expect(message).toContain(second.content.trimEnd())
    expect(message).not.toContain('file="pasted.txt"')
    expect(message).not.toContain("Please review the attached file.")
  })

  it("sends paste body alone when the prompt is empty", () => {
    const paste = createPasteAttachment("Rejected draft details\n".repeat(40))
    const message = buildMessageWithPasteAttachments(
      "   ",
      [paste],
      "Please review the attached file."
    )
    expect(message).toBe(paste.content.trimEnd())
    expect(message).not.toContain("Please review")
    expect(message).not.toContain("```")
  })
})
