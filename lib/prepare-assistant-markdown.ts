import { formatEpochForChat } from "@/lib/format"

/**
 * Turn common LLM markdown mistakes into valid GFM before the renderer parses.
 */

function humanizeRawEpochs(text: string, now = Date.now()) {
  const withEpochs = text
    .replace(/\b(\d{10,13})\s*ms\b/g, (match, raw: string) => {
      return formatEpochForChat(Number(raw), now) ?? match
    })
    .replace(
      /\b(published|generated|updated|created)\s+at\s+(\d{10,13})\b/gi,
      (match, label: string, raw: string) => {
        const formatted = formatEpochForChat(Number(raw), now)
        return formatted ? `${label} at ${formatted}` : match
      }
    )

  return cleanupRelativeTimeProse(withEpochs)
}

function cleanupRelativeTimeProse(text: string) {
  return text
    .replace(
      /(\d+(?:h(?:\s+\d+m)?|\d+m)\s+ago),\s*(?:approximately|about|~)\s+(?:\d+\s*(?:hours?|minutes?|mins?|h|m)(?:\s*(?:and\s*)?\d+\s*(?:minutes?|mins?|m))?)\s*ago/gi,
      "$1"
    )
    .replace(
      /\bbetween approximately (\d+) hour and \1 hour and (\d+) minutes ago\b/gi,
      "between approximately $1 hour and $2 minutes ago"
    )
    .replace(
      /\b(\d+) hour and \1 hour and (\d+) minutes\b/gi,
      "$1 hour and $2 minutes"
    )
    .replace(
      /\s*The published_at timestamps are in Unix milliseconds\.?\s*/gi,
      " "
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function countColumns(row: string) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean).length
}

function isSeparatorRow(row: string) {
  const cells = row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function wrapRow(line: string) {
  const trimmed = line.trim()
  if (trimmed.startsWith("|") && trimmed.endsWith("|")) return trimmed
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean)
  if (cells.length < 2) return line
  return `| ${cells.join(" | ")} |`
}

function isPipeRow(line: string) {
  const trimmed = line.trim()
  if (/^[^|]{12,}[:：][^|]*\|/.test(trimmed)) return false
  return countColumns(trimmed) >= 2
}

function splitGluedRows(line: string) {
  const rows = line
    .trim()
    .split(/(?<=\|)\s+(?=\|)/)
    .map((chunk) => wrapRow(chunk.trim()))
    .filter((row) => countColumns(row) >= 2)
  return rows.length >= 2 ? rows : []
}

function ensureSeparator(rows: string[]) {
  const normalized = rows.map(wrapRow)
  if (normalized.length === 0) return []
  if (normalized.length === 1) {
    const columns = countColumns(normalized[0])
    if (columns < 2) return normalized
    const separator = `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`
    return [normalized[0], separator]
  }
  if (isSeparatorRow(normalized[1])) return normalized
  const columns = countColumns(normalized[0])
  if (columns < 2) return normalized
  const separator = `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`
  return [normalized[0], separator, ...normalized.slice(1)]
}

export function prepareAssistantMarkdown(
  input: string,
  now = Date.now()
): string {
  const text = humanizeRawEpochs(input.replace(/\r\n/g, "\n"), now)
  const withIntroSplit = text.replace(
    /^([^\n|]{8,}[:：]\s*)(\|.+)$/gm,
    (_, intro: string, row: string) => `${intro.trimEnd()}\n\n${wrapRow(row)}`
  )

  const lines = withIntroSplit.split("\n")
  const out: string[] = []
  let table: string[] = []

  const flushTable = () => {
    if (table.length === 0) return
    out.push(...ensureSeparator(table.map(wrapRow)))
    table = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushTable()
      out.push(line)
      continue
    }

    const glued = splitGluedRows(trimmed)
    if (glued.length >= 2) {
      flushTable()
      out.push(...ensureSeparator(glued))
      continue
    }

    if (isSeparatorRow(trimmed)) {
      table.push(trimmed)
      continue
    }

    if (isPipeRow(trimmed)) {
      table.push(trimmed)
      continue
    }

    flushTable()
    out.push(line)
  }

  flushTable()
  return out.join("\n")
}
