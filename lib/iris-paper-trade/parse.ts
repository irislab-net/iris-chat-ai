import {
  NO_TRADE_KEYS,
  NO_TRADE_TOOL_NAME,
  OPEN_PAPER_TRADE_KEYS,
  OPEN_PAPER_TRADE_TOOL_NAME,
} from "@/lib/iris-paper-trade/schema"
import type {
  NoTradeToolArgs,
  OpenPaperTradeToolArgs,
  ParsedPaperDecision,
} from "@/lib/iris-paper-trade/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function extraKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[]
): string[] {
  const allow = new Set(allowed)
  return Object.keys(obj).filter((k) => !allow.has(k))
}

function parseJsonValue(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return null
    }
  }
  return raw
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed)
  const candidate = fenced?.[1]?.trim() ?? trimmed

  try {
    const parsed = JSON.parse(candidate) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    const start = candidate.indexOf("{")
    const end = candidate.lastIndexOf("}")
    if (start < 0 || end <= start) return null
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
}

function asOpenArgs(
  obj: Record<string, unknown>
): { ok: true; args: OpenPaperTradeToolArgs } | { ok: false; error: string } {
  const extra = extraKeys(obj, OPEN_PAPER_TRADE_KEYS)
  if (extra.length > 0) {
    return { ok: false, error: `EXTRA_PROPERTIES:${extra.join(",")}` }
  }
  for (const key of OPEN_PAPER_TRADE_KEYS) {
    if (!(key in obj)) return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }

  const symbol = obj.symbol
  const direction = obj.direction
  const setup = obj.setup
  const thesis = obj.thesis
  const stopLoss = obj.stopLoss
  const takeProfit = obj.takeProfit
  const leverage = obj.leverage

  if (typeof symbol !== "string" || typeof direction !== "string") {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }
  if (typeof setup !== "string" || typeof thesis !== "string") {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }
  if (typeof stopLoss !== "number" || !Number.isFinite(stopLoss)) {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }
  if (typeof takeProfit !== "number" || !Number.isFinite(takeProfit)) {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }
  if (typeof leverage !== "number" || !Number.isInteger(leverage)) {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }

  return {
    ok: true,
    args: {
      symbol: symbol.trim().toUpperCase(),
      direction: direction as OpenPaperTradeToolArgs["direction"],
      setup: setup.trim(),
      stopLoss,
      takeProfit,
      leverage,
      thesis: thesis.trim(),
    },
  }
}

function asNoTradeArgs(
  obj: Record<string, unknown>
): { ok: true; args: NoTradeToolArgs } | { ok: false; error: string } {
  const extra = extraKeys(obj, NO_TRADE_KEYS)
  if (extra.length > 0) {
    return { ok: false, error: `EXTRA_PROPERTIES:${extra.join(",")}` }
  }
  if (typeof obj.reason !== "string") {
    return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  }
  return { ok: true, args: { reason: obj.reason.trim() } }
}

type ToolCallLike = {
  name?: unknown
  tool_name?: unknown
  arguments?: unknown
  input?: unknown
  function?: {
    name?: unknown
    arguments?: unknown
  }
}

function toolName(call: ToolCallLike): string {
  if (typeof call.function?.name === "string") return call.function.name
  if (typeof call.tool_name === "string") return call.tool_name
  if (typeof call.name === "string") return call.name
  return ""
}

function toolArgs(call: ToolCallLike): unknown {
  if (call.function && "arguments" in call.function) {
    return parseJsonValue(call.function.arguments)
  }
  if ("input" in call) return parseJsonValue(call.input)
  return parseJsonValue(call.arguments)
}

function decisionFromTool(
  name: string,
  args: unknown
): { ok: true; decision: ParsedPaperDecision } | { ok: false; error: string } {
  if (!isRecord(args)) return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }

  if (name === OPEN_PAPER_TRADE_TOOL_NAME) {
    const parsed = asOpenArgs(args)
    if (!parsed.ok) return parsed
    return {
      ok: true,
      decision: { action: "OPEN_PAPER_TRADE", args: parsed.args },
    }
  }
  if (name === NO_TRADE_TOOL_NAME) {
    const parsed = asNoTradeArgs(args)
    if (!parsed.ok) return parsed
    return { ok: true, decision: { action: "NO_TRADE", args: parsed.args } }
  }
  return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
}

function decisionFromObject(
  obj: Record<string, unknown>
): { ok: true; decision: ParsedPaperDecision } | { ok: false; error: string } {
  const name =
    typeof obj.name === "string"
      ? obj.name
      : typeof obj.action === "string"
        ? obj.action
        : ""

  if (name === OPEN_PAPER_TRADE_TOOL_NAME || name === "OPEN_PAPER_TRADE") {
    const args = isRecord(obj.arguments) ? obj.arguments : obj
    const body = { ...args }
    delete body.name
    delete body.action
    delete body.arguments
    return decisionFromTool(OPEN_PAPER_TRADE_TOOL_NAME, body)
  }
  if (name === NO_TRADE_TOOL_NAME || name === "NO_TRADE") {
    const args = isRecord(obj.arguments) ? obj.arguments : obj
    const body = { ...args }
    delete body.name
    delete body.action
    delete body.arguments
    return decisionFromTool(NO_TRADE_TOOL_NAME, body)
  }
  return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
}

/**
 * Fail-closed parse: one OPEN_PAPER_TRADE | NO_TRADE tool, or a single JSON object.
 * Extra keys, two tools, or free-form prose → reject.
 */
export function parsePaperDecision(input: {
  message?: string | null
  toolCalls?: unknown
}): { ok: true; decision: ParsedPaperDecision } | { ok: false; error: string } {
  const calls = Array.isArray(input.toolCalls) ? input.toolCalls : []
  if (calls.length > 1) return { ok: false, error: "MULTIPLE_TOOL_CALLS" }

  if (calls.length === 1) {
    const call = calls[0]
    if (!isRecord(call))
      return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
    return decisionFromTool(toolName(call), toolArgs(call))
  }

  const obj = extractJsonObject(input.message ?? "")
  if (!obj) return { ok: false, error: "STRUCTURED_OUTPUT_INVALID" }
  return decisionFromObject(obj)
}
