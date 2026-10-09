export type StakingTransactionStage =
  | "wallet"
  | "approval"
  | "deposit"
  | "depositAfterApproval"
  | "affiliateDeposit"
  | "withdraw"

import { STAKING_CHAIN_ID, STAKING_NETWORK_LABEL } from "@/constants/stakingVaultConfig"

export type StakingToastMessage = {
  title: string
  description: string
}

const FALLBACK_ERROR_BY_STAGE: Record<StakingTransactionStage, StakingToastMessage> = {
  wallet: {
    title: "Wallet not ready",
    description: `Connect and switch to ${STAKING_NETWORK_LABEL} (chain ${STAKING_CHAIN_ID}).`,
  },
  approval: {
    title: "Transaction failed",
    description: "Review and retry.",
  },
  deposit: {
    title: "Transaction failed",
    description: "Review and retry.",
  },
  depositAfterApproval: {
    title: "Transaction failed",
    description: "Review and retry.",
  },
  affiliateDeposit: {
    title: "Referral not applied",
    description: "Clear the saved referral link and try again.",
  },
  withdraw: {
    title: "Transaction failed",
    description: "Review and retry.",
  },
}

export class StakingTransactionError extends Error {
  readonly stage: StakingTransactionStage
  readonly cause?: unknown

  constructor(stage: StakingTransactionStage, cause?: unknown) {
    super(FALLBACK_ERROR_BY_STAGE[stage].description)
    this.name = "StakingTransactionError"
    this.stage = stage
    this.cause = cause
  }
}

function getErrorCode(error: unknown): string | number | null {
  if (!error || typeof error !== "object") return null
  const maybe = error as {
    code?: string | number
    info?: { error?: { code?: string | number } }
    error?: { code?: string | number }
  }
  return maybe.code ?? maybe.info?.error?.code ?? maybe.error?.code ?? null
}

const USER_REJECTED_MESSAGE_PATTERNS: readonly RegExp[] = [
  /user rejected/i,
  /user denied/i,
  /rejected by user/i,
  /user cancelled/i,
  /user canceled/i,
  /request rejected/i,
  /user rejected the request/i,
  /action rejected/i,
  /denied transaction signature/i,
  /wallet request rejected/i,
  /declined/i,
]

function collectWalletErrorText(error: unknown): string {
  const parts: string[] = []
  const visit = (node: unknown, depth: number) => {
    if (depth > 4 || node == null) return
    if (node instanceof Error) {
      parts.push(node.message, node.name)
      visit(node.cause, depth + 1)
      return
    }
    if (typeof node === "string") {
      parts.push(node)
      return
    }
    if (typeof node === "object") {
      const row = node as {
        message?: unknown
        reason?: unknown
        code?: unknown
        error?: unknown
        data?: unknown
      }
      if (typeof row.message === "string") parts.push(row.message)
      if (typeof row.reason === "string") parts.push(row.reason)
      if (row.code != null) parts.push(String(row.code))
      visit(row.error, depth + 1)
      visit(row.data, depth + 1)
    }
  }
  visit(error, 0)
  return parts.join(" ")
}

function isUserRejectedMessage(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  return USER_REJECTED_MESSAGE_PATTERNS.some(re => re.test(normalized))
}

function isUserRejected(error: unknown): boolean {
  const code = getErrorCode(error)
  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    code === "USER_REJECTED"
  ) {
    return true
  }
  return isUserRejectedMessage(collectWalletErrorText(error))
}

/** Wallet signature / tx request explicitly rejected by the user (MetaMask, WC, etc.). */
export function isStakingWalletUserRejectedError(error: unknown): boolean {
  if (isUserRejected(error)) return true
  if (error instanceof StakingTransactionError) {
    return isUserRejected(error.cause)
  }
  return false
}

const INSUFFICIENT_GAS_MESSAGE_PATTERNS: readonly RegExp[] = [
  /insufficient funds/i,
  /insufficient balance/i,
  /intrinsic transaction cost/i,
  /not enough eth/i,
  /insufficient.*gas/i,
  /gas fee unavailable/i,
  /fee.*unavailable/i,
  /cannot afford/i,
  /exceeds balance/i,
]

function isInsufficientFunds(error: unknown): boolean {
  const code = getErrorCode(error)
  if (code === "INSUFFICIENT_FUNDS") return true
  const text = collectWalletErrorText(error)
  return INSUFFICIENT_GAS_MESSAGE_PATTERNS.some(re => re.test(text))
}

/** Stake/deposit wallet send rejected due to insufficient native gas balance. */
export function isStakingInsufficientGasError(error: unknown): boolean {
  if (isInsufficientFunds(error)) return true
  if (error instanceof StakingTransactionError) {
    return isInsufficientFunds(error.cause)
  }
  return false
}

export type StakeWalletErrorKind = "user_rejected" | "insufficient_gas" | "other"

export function classifyStakeWalletError(error: unknown): {
  kind: StakeWalletErrorKind
  errorCode: string | number | null
  errorAction: string | null
  errorMessage: string
} {
  const cause =
    error instanceof StakingTransactionError ? error.cause ?? error : error
  const errorCode = getErrorCode(cause)
  const errorMessage = collectWalletErrorText(cause).trim()
  const errorAction =
    typeof cause === "object" &&
    cause != null &&
    "action" in cause &&
    typeof (cause as { action?: unknown }).action === "string"
      ? String((cause as { action: string }).action)
      : null

  if (isStakingWalletUserRejectedError(cause)) {
    return { kind: "user_rejected", errorCode, errorAction, errorMessage }
  }
  if (isStakingInsufficientGasError(cause)) {
    return { kind: "insufficient_gas", errorCode, errorAction, errorMessage }
  }
  return { kind: "other", errorCode, errorAction, errorMessage }
}

export function getStakingTransactionErrorMessage(
  error: unknown,
  fallbackStage: StakingTransactionStage
): StakingToastMessage {
  const stage =
    error instanceof StakingTransactionError ? error.stage : fallbackStage
  const cause =
    error instanceof StakingTransactionError ? error.cause : error

  if (isUserRejected(cause)) {
    return {
      title: "Cancelled",
      description: "",
    }
  }

  if (isInsufficientFunds(cause)) {
    return {
      title: "Insufficient balance",
      description: "Add ETH for the network fee.",
    }
  }

  return FALLBACK_ERROR_BY_STAGE[stage]
}

export const STAKING_SUCCESS_MESSAGES = {
  deposit: {
    title: "Deposit confirmed",
    description: "Funds are staked on-chain.",
  },
  withdraw: {
    title: "Withdraw confirmed",
    description: "Funds are available per vault rules.",
  },
} satisfies Record<"deposit" | "withdraw", StakingToastMessage>
