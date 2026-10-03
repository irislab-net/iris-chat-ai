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
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)(.*)$/)
      if (!match) return line
      return `${match[1]}${match[2].replace(/[ \t]{2,}/g, " ")}`
    })
    .join("\n")
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

const CODE_LANG_KEEP = new Set([
  "js",
  "javascript",
  "ts",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "py",
  "json",
  "html",
  "css",
  "sql",
  "bash",
  "sh",
  "shell",
  "zsh",
  "yaml",
  "yml",
  "toml",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "r",
  "scala",
  "diff",
  "xml",
  "graphql",
])

function looksLikeCode(body: string) {
  return /\b(function|const |let |var |import |export |class |def |return |=>|<\/?[a-zA-Z]|{\s*$|;\s*$)/m.test(
    body
  )
}

/** Market level boards / RTL prose the model wrongly fenced as code. */
function looksLikeProseBoard(body: string) {
  if (!body.trim() || looksLikeCode(body)) return false
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const bracketLines = lines.filter((line) => /^\[[^\]]+\]/.test(line)).length
  const dashSep = lines.filter(
    (line) => /^-{4,}/.test(line) || /^-{3,}.+-{3,}$/.test(line)
  ).length
  if (bracketLines >= 2) return true
  if (bracketLines >= 1 && dashSep >= 1) return true
  return /[\u0600-\u06FF]/.test(body) && bracketLines + dashSep >= 1
}

/** ASCII liquidity / pocket ladders drawn with box-drawing characters. */
function looksLikeAsciiTimeline(body: string) {
  if (!body.trim() || looksLikeCode(body)) return false
  const boxChars = (body.match(/[─┬┼┴│├┤└┘┌┐━═]/g) || []).length
  const connectors =
    (
      body.match(
        /(?:[─━═\-]{2,})[┬┼┴+](?:[─━═\-]{2,})/g
      ) || []
    ).length
  const railBullets = (body.match(/^[|│]\s*[•\-*]/gm) || []).length
  const pocketLabels = (body.match(/\[(?:Pocket|Level|Zone)\b/gi) || []).length
  if (connectors >= 2 && railBullets >= 2) return true
  if (boxChars >= 6 && railBullets >= 2) return true
  if (connectors >= 1 && pocketLabels >= 1 && railBullets >= 1) return true
  return false
}

function isAsciiTimelineHeader(trimmed: string) {
  return /(?:[─━═\-]{2,})[┬┼┴+](?:[─━═\-]{2,})/.test(trimmed)
}

function isAsciiTimelineBullet(trimmed: string) {
  return /^[|│]?\s*[•\-*]\s+\S/.test(trimmed)
}

function isAsciiTimelineRailOnly(trimmed: string) {
  return /^[|│]\s*$/.test(trimmed)
}

function parseAsciiTimelineHeader(trimmed: string): {
  price?: string
  title: string
  range?: string
} | null {
  const withPrice = trimmed.match(
    /^(\$?[\d,]+(?:\.\d+)?)\s+(?:[─━═\-]{2,})[┬┼┴+](?:[─━═\-]{2,})\s*(?:\[([^\]]+)\]|(.+?))(?:\s*\(([^)]+)\))?\s*$/
  )
  if (withPrice) {
    return {
      price: withPrice[1].trim(),
      title: (withPrice[2] || withPrice[3] || "").trim(),
      range: withPrice[4]?.trim(),
    }
  }

  const withoutPrice = trimmed.match(
    /^(?:[─━═\-]{2,})[┬┼┴+](?:[─━═\-]{2,})\s*(?:\[([^\]]+)\]|(.+?))(?:\s*\(([^)]+)\))?\s*$/
  )
  if (withoutPrice) {
    return {
      title: (withoutPrice[1] || withoutPrice[2] || "").trim(),
      range: withoutPrice[3]?.trim(),
    }
  }

  return null
}

function formatAsciiTimelineItem(item: {
  price?: string
  title: string
  range?: string
  bullets: string[]
}) {
  const title = item.title.replace(/^Pocket\s+/i, "Pocket ")
  const head = item.price
    ? `**${item.price}** — ${title}`
    : `**${title}**`
  const withRange = item.range ? `${head} · _${item.range}_` : head
  const lines = [`- ${withRange}`]
  for (const bullet of item.bullets) {
    lines.push(`  - ${bullet}`)
  }
  return lines.join("\n")
}

function formatAsciiTimelineBody(body: string) {
  const items: {
    price?: string
    title: string
    range?: string
    bullets: string[]
  }[] = []
  let current: (typeof items)[number] | null = null

  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = raw.trim()
    if (!trimmed || isAsciiTimelineRailOnly(trimmed)) continue

    if (isAsciiTimelineHeader(trimmed)) {
      const parsed = parseAsciiTimelineHeader(trimmed)
      if (parsed?.title) {
        current = {
          price: parsed.price,
          title: parsed.title,
          range: parsed.range,
          bullets: [],
        }
        items.push(current)
        continue
      }
    }

    const bullet = trimmed.match(/^[|│]?\s*[•\-*]\s+(.+)$/)
    if (bullet) {
      if (!current) {
        current = { title: "Level", bullets: [] }
        items.push(current)
      }
      current.bullets.push(bullet[1].trim())
      continue
    }

    // Soft-fail: keep leftover prose as its own bullet under the active node.
    if (current && !/^```/.test(trimmed)) {
      current.bullets.push(trimmed.replace(/^[|│]\s*/, ""))
    }
  }

  if (items.length === 0) return body.trim()
  return items.map(formatAsciiTimelineItem).join("\n\n")
}

/**
 * Convert unfenced ASCII ladders (model sometimes skips code fences).
 * Skips content already inside fenced blocks.
 */
function normalizeUnfencedAsciiTimelines(text: string) {
  const lines = text.split("\n")
  const out: string[] = []
  let inFence = false
  let block: string[] = []

  const flushBlock = () => {
    if (block.length === 0) return
    const body = block.join("\n")
    if (looksLikeAsciiTimeline(body)) {
      out.push("", formatAsciiTimelineBody(body), "")
    } else {
      out.push(...block)
    }
    block = []
  }

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      flushBlock()
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const trimmed = line.trim()
    const inTimelineLine =
      isAsciiTimelineHeader(trimmed) ||
      isAsciiTimelineBullet(trimmed) ||
      isAsciiTimelineRailOnly(trimmed)

    if (inTimelineLine) {
      block.push(line)
      continue
    }

    if (block.length > 0 && !trimmed) {
      block.push(line)
      continue
    }

    flushBlock()
    out.push(line)
  }

  flushBlock()
  return out.join("\n").replace(/\n{3,}/g, "\n\n")
}

function formatBoardLine(trimmed: string) {
  const bracket = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/)
  if (bracket) {
    const label = bracket[1].trim()
    const rest = bracket[2].trim()
    const withNote = rest.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    if (withNote) {
      return `**${label}** — ${withNote[1].trim()} · _${withNote[2].trim()}_`
    }
    return `**${label}** — ${rest}`
  }

  const kv = trimmed.match(/^([^:\n]{2,48}):\s*(.+)$/)
  if (kv) return `**${kv[1].trim()}:** ${kv[2].trim()}`

  return trimmed
}

function formatBoardBody(body: string) {
  const out: string[] = []
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) {
      out.push("")
      continue
    }

    const midSep = trimmed.match(/^-{3,}\s*(.+?)\s*-{3,}$/)
    if (midSep) {
      out.push("", "---", "", formatBoardLine(midSep[1]), "", "---", "")
      continue
    }

    if (/^-{4,}$/.test(trimmed)) {
      out.push("", "---", "")
      continue
    }

    out.push(formatBoardLine(trimmed), "")
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** Unwrap ``` fences that are market boards / ASCII ladders / prose, not real code. */
function unwrapProseFences(text: string) {
  return text.replace(
    /```([a-zA-Z0-9_-]*)[ \t]*\n([\s\S]*?)```/g,
    (match, lang: string, body: string) => {
      const language = (lang || "").toLowerCase()
      if (language && CODE_LANG_KEEP.has(language)) return match
      if (looksLikeAsciiTimeline(body)) {
        return `\n\n${formatAsciiTimelineBody(body)}\n\n`
      }
      if (!looksLikeProseBoard(body)) return match
      return `\n\n${formatBoardBody(body)}\n\n`
    }
  )
}

export function prepareAssistantMarkdown(
  input: string,
  now = Date.now()
): string {
  const text = humanizeRawEpochs(
    normalizeUnfencedAsciiTimelines(
      unwrapProseFences(input.replace(/\r\n/g, "\n"))
    ),
    now
  )
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
