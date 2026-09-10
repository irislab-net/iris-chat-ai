import type { TradingAccess } from "@/lib/trading/access"
import type { WalletReadinessStatus } from "@/lib/wallet/identity"
import type { TradingMode } from "@/lib/trading/types"

export type DemoTradingReadiness = {
  mode: "demo"
  status: "READY"
  canSubmit: true
  message: null
}

export type RealTradingStatus =
  | "AUTH_REQUIRED"
  | "WALLET_REQUIRED"
  | "WALLET_UNVERIFIED"
  | "WALLET_INVALID"
  | "ENTITLEMENT_REQUIRED"
  | "UNSUPPORTED"
  | "CONNECTING"
  | "READ_ONLY"
  | "EXECUTION_READY"

export type RealTradingReadiness = {
  mode: "real"
  status: RealTradingStatus
  canSubmit: boolean
  message: string
}

export type TradingReadiness = DemoTradingReadiness | RealTradingReadiness

export function demoTradingReadiness(): DemoTradingReadiness {
  return { mode: "demo", status: "READY", canSubmit: true, message: null }
}

/**
 * Real trading readiness. This phase only reaches READ_ONLY — execution stays
 * disabled even when entitlements would allow EXECUTION_READY.
 */
export function realTradingReadiness(input: {
  isAuthenticated: boolean
  access: TradingAccess
  adapterMode: "UNAVAILABLE" | "READ_ONLY" | "EXECUTION"
  walletStatus?: WalletReadinessStatus
  accountStatus?: "CONNECTING" | "READY" | "STALE" | "ERROR" | "UNAVAILABLE"
  allowExecution?: boolean
  signerAvailable?: boolean
}): RealTradingReadiness {
  if (!input.isAuthenticated) {
    return {
      mode: "real",
      status: "AUTH_REQUIRED",
      canSubmit: false,
      message: "Connect your IRIS account before using Real Trading.",
    }
  }

  const walletStatus = input.walletStatus ?? "MISSING"
  if (walletStatus === "MISSING") {
    return {
      mode: "real",
      status: "WALLET_REQUIRED",
      canSubmit: false,
      message: "Link and verify a wallet before using Real Trading.",
    }
  }
  if (walletStatus === "UNVERIFIED") {
    return {
      mode: "real",
      status: "WALLET_UNVERIFIED",
      canSubmit: false,
      message: "Wallet ownership has not been verified for this account.",
    }
  }
  if (walletStatus === "INVALID") {
    return {
      mode: "real",
      status: "WALLET_INVALID",
      canSubmit: false,
      message: "The linked wallet address is not valid for this account.",
    }
  }

  if (input.adapterMode === "UNAVAILABLE") {
    return {
      mode: "real",
      status: "UNSUPPORTED",
      canSubmit: false,
      message: "Hyperliquid account infrastructure is unavailable in this build.",
    }
  }

  if (input.accountStatus === "CONNECTING") {
    return {
      mode: "real",
      status: "CONNECTING",
      canSubmit: false,
      message: "Connecting to the trading account…",
    }
  }

  if (input.accountStatus === "STALE") {
    return {
      mode: "real",
      status: "READ_ONLY",
      canSubmit: false,
      message: "Hyperliquid account data is read-only and currently stale.",
    }
  }

  if (input.accountStatus !== "READY") {
    return {
      mode: "real",
      status: "UNSUPPORTED",
      canSubmit: false,
      message: "The trading account is unavailable.",
    }
  }

  if (input.adapterMode === "READ_ONLY") {
    return {
      mode: "real",
      status: "READ_ONLY",
      canSubmit: false,
      message: "The Hyperliquid account is connected in read-only mode.",
    }
  }

  if (!input.access.resolved || !input.access.canUseRealTrading) {
    return {
      mode: "real",
      status: "ENTITLEMENT_REQUIRED",
      canSubmit: false,
      message: input.access.resolved
        ? "Your account does not currently include Real Trading access."
        : "Real Trading access has not been verified by the server.",
    }
  }

  if (input.adapterMode === "EXECUTION" && input.signerAvailable === false) {
    return {
      mode: "real",
      status: "READ_ONLY",
      canSubmit: false,
      message: "Hyperliquid testnet signer is unavailable. Account remains read-only.",
    }
  }

  if (input.allowExecution !== true) {
    return {
      mode: "real",
      status: "READ_ONLY",
      canSubmit: false,
      message: "Real Trading execution is not enabled in this build.",
    }
  }

  return {
    mode: "real",
    status: "EXECUTION_READY",
    canSubmit: true,
    message: "Real Trading execution is ready.",
  }
}

export function canSubmitTradingOrder(input: {
  mode: TradingMode
  readiness: TradingReadiness
  hasAdapter: boolean
}): boolean {
  return (
    input.hasAdapter &&
    input.readiness.mode === input.mode &&
    input.readiness.canSubmit
  )
}
