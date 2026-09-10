import type {
  ExecutionAction,
  ExecutionRecord,
  Order,
  OrderSide,
  TradingError,
} from "@/lib/trading/types"
import type { HyperliquidNetwork } from "@/lib/trading/hyperliquid/network"

export type SignerStatus = {
  available: boolean
  network: HyperliquidNetwork
  walletIdentityId: string | null
  expiresAt: string | null
}

/** Isolated signer boundary — private keys stay server-side (Model B). */
export interface HyperliquidExecutionSigner {
  getStatus(walletIdentityId: string): Promise<SignerStatus>
}

export type ExecutionSubmitInput = {
  walletIdentityId: string
  idempotencyKey: string
  clientOrderId: string
  action: ExecutionAction
  symbol: string
  side?: OrderSide
  quantity?: string
  orderId?: string
  exchangeOrderId?: string
  leverage?: number
}

export type ExecutionSubmitResult =
  | {
      ok: true
      execution: ExecutionRecord
      order: Order | null
    }
  | {
      ok: false
      execution: ExecutionRecord | null
      error: TradingError
    }

export interface HyperliquidExecutionService {
  getSignerStatus(walletIdentityId: string): Promise<SignerStatus>
  submit(input: ExecutionSubmitInput): Promise<ExecutionSubmitResult>
}

export class UnavailableHyperliquidExecutionSigner implements HyperliquidExecutionSigner {
  async getStatus(): Promise<SignerStatus> {
    return {
      available: false,
      network: "testnet",
      walletIdentityId: null,
      expiresAt: null,
    }
  }
}

export class UnavailableHyperliquidExecutionService implements HyperliquidExecutionService {
  async getSignerStatus(walletIdentityId: string): Promise<SignerStatus> {
    return {
      available: false,
      network: "testnet",
      walletIdentityId,
      expiresAt: null,
    }
  }

  async submit(): Promise<ExecutionSubmitResult> {
    return {
      ok: false,
      execution: null,
      error: {
        code: "SIGNER_UNAVAILABLE",
        message: "Hyperliquid testnet execution signer is unavailable.",
        retryable: false,
      },
    }
  }
}
