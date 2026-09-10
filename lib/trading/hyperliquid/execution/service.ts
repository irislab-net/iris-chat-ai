import { apiJson } from "@/lib/api/client"
import type {
  ExecutionAction,
  ExecutionLifecycleState,
  ExecutionRecord,
  Order,
  TradingError,
} from "@/lib/trading/types"
import { emitExecutionObservability } from "@/lib/trading/hyperliquid/execution/observability"
import {
  fetchExecutionKillSwitch,
  type ExecutionKillSwitch,
} from "@/lib/trading/hyperliquid/execution/kill-switch"
import {
  assertExecutionNetwork,
  HYPERLIQUID_EXECUTION_NETWORK,
} from "@/lib/trading/hyperliquid/network"
import type {
  ExecutionSubmitInput,
  ExecutionSubmitResult,
  HyperliquidExecutionService,
  HyperliquidExecutionSigner,
  SignerStatus,
} from "@/lib/trading/hyperliquid/execution/signer"

type ExecuteApiRequest = {
  idempotency_key: string
  client_order_id: string
  wallet_identity_id: string
  action: ExecutionAction
  symbol: string
  side?: string
  quantity?: string
  order_id?: string
  exchange_order_id?: string
  leverage?: number
  network: "testnet"
}

type ExecuteApiResponse = {
  execution: {
    id: string
    idempotency_key: string
    client_order_id: string
    action: ExecutionAction
    lifecycle: ExecutionLifecycleState
    symbol: string
    order_id: string | null
    exchange_order_id: string | null
    created_at: string
    updated_at: string
    error?: {
      code: TradingError["code"]
      message: string
      retryable: boolean
      provider_code?: string
    } | null
  }
  order?: Order | null
}

type SignerStatusApiResponse = {
  available: boolean
  network: "testnet"
  wallet_identity_id: string | null
  expires_at: string | null
}

function unwrap<T>(body: unknown, pick: (value: Record<string, unknown>) => T): T {
  if (!body || typeof body !== "object") {
    throw new Error("Malformed execution API response")
  }
  const record = body as Record<string, unknown>
  if (record.data && typeof record.data === "object") {
    return pick(record.data as Record<string, unknown>)
  }
  return pick(record)
}

function mapExecution(raw: ExecuteApiResponse["execution"]): ExecutionRecord {
  return {
    id: raw.id,
    idempotencyKey: raw.idempotency_key,
    clientOrderId: raw.client_order_id,
    action: raw.action,
    lifecycle: raw.lifecycle,
    symbol: raw.symbol,
    orderId: raw.order_id,
    exchangeOrderId: raw.exchange_order_id,
    createdAt: Date.parse(raw.created_at),
    updatedAt: Date.parse(raw.updated_at),
    error: raw.error
      ? {
          code: raw.error.code,
          message: raw.error.message,
          retryable: raw.error.retryable,
          providerCode: raw.error.provider_code,
        }
      : null,
  }
}

export class BackendHyperliquidExecutionSigner implements HyperliquidExecutionSigner {
  async getStatus(walletIdentityId: string): Promise<SignerStatus> {
    assertExecutionNetwork(HYPERLIQUID_EXECUTION_NETWORK)
    try {
      const body = await apiJson<unknown>(
        `/v1/trading/hyperliquid/signer/status?wallet_identity_id=${encodeURIComponent(walletIdentityId)}`
      )
      const status = unwrap(body, (data) => data as SignerStatusApiResponse)
      return {
        available: status.available === true,
        network: "testnet",
        walletIdentityId: status.wallet_identity_id,
        expiresAt: status.expires_at,
      }
    } catch {
      return {
        available: false,
        network: "testnet",
        walletIdentityId,
        expiresAt: null,
      }
    }
  }
}

export class BackendHyperliquidExecutionService implements HyperliquidExecutionService {
  constructor(
    private readonly signer: HyperliquidExecutionSigner = new BackendHyperliquidExecutionSigner(),
    private readonly loadKillSwitch: () => Promise<ExecutionKillSwitch> = fetchExecutionKillSwitch
  ) {}

  getSignerStatus(walletIdentityId: string): Promise<SignerStatus> {
    return this.signer.getStatus(walletIdentityId)
  }

  async submit(input: ExecutionSubmitInput): Promise<ExecutionSubmitResult> {
    assertExecutionNetwork(HYPERLIQUID_EXECUTION_NETWORK)

    const killSwitch = await this.loadKillSwitch()
    if (!killSwitch.globalExecutionEnabled || !killSwitch.userExecutionEnabled) {
      return {
        ok: false,
        execution: null,
        error: {
          code: "NOT_READY",
          message: "Execution is disabled by operational controls.",
          retryable: false,
        },
      }
    }
    if (
      killSwitch.disabledMarkets.some(
        (market) => market.toUpperCase() === input.symbol.toUpperCase()
      )
    ) {
      return {
        ok: false,
        execution: null,
        error: {
          code: "NOT_READY",
          message: `Execution is disabled for ${input.symbol.toUpperCase()}.`,
          retryable: false,
        },
      }
    }

    const signer = await this.getSignerStatus(input.walletIdentityId)
    if (!signer.available) {
      return {
        ok: false,
        execution: null,
        error: {
          code: "SIGNER_UNAVAILABLE",
          message: "Hyperliquid testnet signer is unavailable for this wallet.",
          retryable: false,
        },
      }
    }
    if (signer.expiresAt != null && Date.parse(signer.expiresAt) <= Date.now()) {
      return {
        ok: false,
        execution: null,
        error: {
          code: "PERMISSION_EXPIRED",
          message: "Execution permission has expired.",
          retryable: false,
        },
      }
    }

    const payload: ExecuteApiRequest = {
      idempotency_key: input.idempotencyKey,
      client_order_id: input.clientOrderId,
      wallet_identity_id: input.walletIdentityId,
      action: input.action,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      order_id: input.orderId,
      exchange_order_id: input.exchangeOrderId,
      leverage: input.leverage,
      network: "testnet",
    }

    emitExecutionObservability({
      phase: "SIGNING_STARTED",
      requestId: input.idempotencyKey,
      walletIdentityId: input.walletIdentityId,
      symbol: input.symbol,
      action: input.action,
      clientOrderId: input.clientOrderId,
      idempotencyKey: input.idempotencyKey,
    })

    try {
      const body = await apiJson<unknown>("/v1/trading/hyperliquid/execute", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const response = unwrap(body, (data) => data as ExecuteApiResponse)
      const execution = mapExecution(response.execution)
      if (execution.lifecycle === "REJECTED" || execution.lifecycle === "FAILED") {
        return {
          ok: false,
          execution,
          error: execution.error ?? {
            code: "PROVIDER_REJECTED",
            message: "Hyperliquid rejected the execution request.",
            retryable: false,
          },
        }
      }
      return { ok: true, execution, order: response.order ?? null }
    } catch (error) {
      const status = (error as { status?: number }).status
      const message =
        error instanceof Error ? error.message : "Execution request failed."
      return {
        ok: false,
        execution: null,
        error: {
          code: status === 403 ? "ENTITLEMENT_REQUIRED" : "UNKNOWN",
          message,
          retryable: status != null && status >= 500,
        },
      }
    }
  }
}
