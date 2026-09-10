import { isValidWalletAddress, normalizeWalletAddress } from "@/lib/wallet/address"
import type { WalletIdentity, WalletLifecycleState } from "@/lib/wallet/types"

export type WalletReadinessStatus = "MISSING" | "UNVERIFIED" | "INVALID" | "VERIFIED"

const UNVERIFIED_LIFECYCLES = new Set<WalletLifecycleState>([
  "CONNECTING",
  "CHALLENGE_CREATED",
  "SIGNATURE_PENDING",
  "CHANGED",
])

/** Address trusted for trading only after server-side ownership verification. */
export function verifiedWalletAddress(
  identity: WalletIdentity | null | undefined
): string | null {
  if (identity?.lifecycle !== "VERIFIED") return null
  if (!isValidWalletAddress(identity.address)) return null
  return normalizeWalletAddress(identity.address)
}

export function walletReadinessStatus(input: {
  lifecycle: WalletLifecycleState
  address: string | null
}): WalletReadinessStatus {
  if (input.lifecycle === "NO_WALLET" || input.lifecycle === "REVOKED") {
    return "MISSING"
  }
  if (UNVERIFIED_LIFECYCLES.has(input.lifecycle)) {
    return "UNVERIFIED"
  }
  if (input.lifecycle === "VERIFIED") {
    return isValidWalletAddress(input.address) ? "VERIFIED" : "INVALID"
  }
  if (input.address != null && !isValidWalletAddress(input.address)) {
    return "INVALID"
  }
  return "UNVERIFIED"
}

export function primaryWalletIdentity(
  wallets: readonly WalletIdentity[]
): WalletIdentity | null {
  const verified = wallets.find((wallet) => wallet.lifecycle === "VERIFIED")
  if (verified) return verified
  return wallets[0] ?? null
}

export function walletLifecycleFromIdentity(
  identity: WalletIdentity | null
): WalletLifecycleState {
  return identity?.lifecycle ?? "NO_WALLET"
}
