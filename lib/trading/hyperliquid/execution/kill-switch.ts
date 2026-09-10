import { apiJson } from "@/lib/api/client"

export type ExecutionKillSwitch = {
  source: "SERVER" | "DEFAULT"
  globalExecutionEnabled: boolean
  userExecutionEnabled: boolean
  disabledMarkets: readonly string[]
}

export const DEFAULT_KILL_SWITCH: ExecutionKillSwitch = {
  source: "DEFAULT",
  globalExecutionEnabled: true,
  userExecutionEnabled: true,
  disabledMarkets: [],
}

type KillSwitchApiResponse = {
  global_execution_enabled?: boolean
  user_execution_enabled?: boolean
  disabled_markets?: string[]
}

function unwrapKillSwitch(body: unknown): ExecutionKillSwitch {
  if (!body || typeof body !== "object") return DEFAULT_KILL_SWITCH
  const record = body as Record<string, unknown>
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as KillSwitchApiResponse)
      : (record as KillSwitchApiResponse)
  return {
    source: "SERVER",
    globalExecutionEnabled: data.global_execution_enabled !== false,
    userExecutionEnabled: data.user_execution_enabled !== false,
    disabledMarkets: Array.isArray(data.disabled_markets)
      ? data.disabled_markets.map(String)
      : [],
  }
}

export async function fetchExecutionKillSwitch(): Promise<ExecutionKillSwitch> {
  try {
    const body = await apiJson<unknown>("/v1/trading/hyperliquid/controls")
    return unwrapKillSwitch(body)
  } catch {
    return DEFAULT_KILL_SWITCH
  }
}

export function isExecutionAllowed(
  killSwitch: ExecutionKillSwitch,
  symbol: string
): { allowed: true } | { allowed: false; reason: string } {
  if (!killSwitch.globalExecutionEnabled) {
    return { allowed: false, reason: "Global execution is disabled." }
  }
  if (!killSwitch.userExecutionEnabled) {
    return { allowed: false, reason: "Execution is disabled for this user." }
  }
  const normalized = symbol.toUpperCase()
  if (killSwitch.disabledMarkets.some((market) => market.toUpperCase() === normalized)) {
    return { allowed: false, reason: `Execution is disabled for ${normalized}.` }
  }
  return { allowed: true }
}
