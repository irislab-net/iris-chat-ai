import {
  CODE_LANG_KEEP,
  normalizeAssistantContent,
  type NormalizeResult,
} from "@/lib/chat/normalize-assistant-content"

export type AssistantBlock =
  | { type: "markdown"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "table"; markdown: string }
  | { type: "tree"; markdown: string }
  | { type: "unknown"; raw: string; reason: string }

export type SegmentResult = {
  blocks: AssistantBlock[]
  normalized: NormalizeResult
}

function isTableLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed.includes("|")) return false
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim())
  return cells.filter(Boolean).length >= 2
}

function isTableSeparator(line: string) {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim())
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
}

function looksLikeNestedTreeList(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  if (lines.length < 3) return false
  const listLines = lines.filter((l) => /^\s*[-*]\s+/.test(l))
  const nested = lines.filter((l) => /^ {2,}[-*]\s+/.test(l))
  const priceHeads = listLines.filter((l) =>
    /\*\*\$?[\d,]/.test(l) || /\*\*[۱۲۳۴۵۶۷۸۹۰0-9]/.test(l)
  )
  return (
    listLines.length / lines.length >= 0.55 &&
    (nested.length >= 2 || priceHeads.length >= 2)
  )
}

function countTableRows(markdown: string) {
  return markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && isTableLine(l) && !isTableSeparator(l)).length
}

function countTreeNodes(markdown: string) {
  return markdown
    .split("\n")
    .filter((l) => /^[-*]\s+/.test(l.trim()) && !/^ {2}/.test(l)).length
}

export function tableExceedsPreviewThreshold(markdown: string) {
  // Desk tables are usually 5–8 rows; only promote very large boards to Sheet.
  return countTableRows(markdown) > 12
}

export function treeExceedsPreviewThreshold(markdown: string) {
  return countTreeNodes(markdown) > 8
}

/**
 * Normalize then split assistant output into typed blocks.
 * Residual box-drawing that failed normalize becomes `unknown` (FallbackBlock).
 */
export function segmentAssistantBlocks(
  input: string,
  now = Date.now()
): SegmentResult {
  const normalized = normalizeAssistantContent(input, now)
  const text = normalized.text

  if (normalized.residualBoxDrawing) {
    // Keep prose; isolate leftover box-drawing lines instead of nuking the turn.
    const boxLine = /[├└┬┼┴│─┌┐┘┤┬║═╔╗╚╝╠╣╦╩╬]/
    const lines = text.split("\n")
    const softBlocks: AssistantBlock[] = []
    let mdBuf: string[] = []
    let boxBuf: string[] = []
    const flushMd = () => {
      const chunk = mdBuf.join("\n").trim()
      if (chunk) softBlocks.push({ type: "markdown", text: chunk })
      mdBuf = []
    }
    const flushBox = () => {
      if (boxBuf.length === 0) return
      softBlocks.push({
        type: "unknown",
        raw: boxBuf.join("\n"),
        reason: "residual-box-drawing",
      })
      boxBuf = []
    }
    for (const line of lines) {
      if (boxLine.test(line)) {
        flushMd()
        boxBuf.push(line)
      } else {
        flushBox()
        mdBuf.push(line)
      }
    }
    flushMd()
    flushBox()
    if (softBlocks.length === 0) {
      softBlocks.push({ type: "markdown", text: text || input })
    }
    return { normalized, blocks: softBlocks }
  }

  const blocks: AssistantBlock[] = []
  const pushMarkdown = (chunk: string, preferTree: boolean) => {
    const trimmed = chunk.trim()
    if (!trimmed) return
    if (preferTree || looksLikeNestedTreeList(trimmed)) {
      blocks.push({ type: "tree", markdown: trimmed })
      return
    }
    blocks.push({ type: "markdown", text: trimmed })
  }

  const preferTree = normalized.convertedTree
  const lines = text.split("\n")
  let i = 0
  let buffer: string[] = []

  const flushBuffer = () => {
    if (buffer.length === 0) return
    pushMarkdown(buffer.join("\n"), preferTree)
    buffer = []
  }

  while (i < lines.length) {
    const line = lines[i]
    const fence = line.trim().match(/^```([a-zA-Z0-9_-]*)\s*$/)
    if (fence) {
      flushBuffer()
      const language = (fence[1] || "").toLowerCase() || undefined
      const body: string[] = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        body.push(lines[i])
        i += 1
      }
      const code = body.join("\n")
      if (language && CODE_LANG_KEEP.has(language)) {
        blocks.push({ type: "code", language, code })
      } else if (!language && looksLikeNestedTreeList(code)) {
        blocks.push({ type: "tree", markdown: code })
      } else {
        blocks.push({
          type: "code",
          language: language || undefined,
          code,
        })
      }
      i += 1
      continue
    }

    if (isTableLine(line) || isTableSeparator(line)) {
      // Keep a trailing heading with the table so title↔table spacing stays inside one Streamdown.
      const attached: string[] = []
      while (buffer.length > 0) {
        const last = buffer[buffer.length - 1]
        if (!last.trim()) {
          attached.unshift(buffer.pop()!)
          continue
        }
        if (/^#{1,6}\s+\S/.test(last.trim())) {
          attached.unshift(buffer.pop()!)
          while (buffer.length > 0 && !buffer[buffer.length - 1].trim()) {
            attached.unshift(buffer.pop()!)
          }
          break
        }
        break
      }
      flushBuffer()
      const tableLines: string[] = []
      while (
        i < lines.length &&
        (isTableLine(lines[i]) ||
          isTableSeparator(lines[i]) ||
          (tableLines.length > 0 && !lines[i].trim()))
      ) {
        if (!lines[i].trim() && tableLines.length > 0) {
          // blank ends table
          break
        }
        tableLines.push(lines[i])
        i += 1
      }
      const markdown = [...attached, ...tableLines].join("\n").trim()
      if (markdown) blocks.push({ type: "table", markdown })
      continue
    }

    buffer.push(line)
    i += 1
  }

  flushBuffer()

  if (blocks.length === 0) {
    blocks.push({ type: "markdown", text: "" })
  }

  return { blocks, normalized }
}
