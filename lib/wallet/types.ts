/** Wallet lifecycle — separate from trading account or agent wallet state. */
export type WalletLifecycleState =
  | "NO_WALLET"
  | "CONNECTING"
  | "CHALLENGE_CREATED"
  | "SIGNATURE_PENDING"
  | "VERIFIED"
  | "REVOKED"
  | "CHANGED"

export type WalletIdentity = {
  id: string
  userId: string
  address: string
  lifecycle: WalletLifecycleState
  verifiedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WalletChallenge = {
  id: string
  userId: string
  address: string
  message: string
  nonce: string
  expiresAt: number
  createdAt: number
}

export type WalletAuditEventType =
  | "WALLET_CHALLENGE_CREATED"
  | "WALLET_VERIFICATION_FAILED"
  | "WALLET_VERIFIED"
  | "WALLET_LINKED"
  | "WALLET_UNLINKED"
  | "WALLET_CHANGED"

export type WalletAuditEvent = {
  type: WalletAuditEventType
  userId: string
  walletIdentityId: string | null
  address: string | null
  challengeId: string | null
  reason: string | null
  occurredAt: number
}

export type WalletVerificationFailureReason =
  | "CHALLENGE_NOT_FOUND"
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_ALREADY_USED"
  | "INVALID_SIGNATURE"
  | "ADDRESS_MISMATCH"
  | "INVALID_ADDRESS"

export type WalletVerificationResult =
  | { ok: true; identity: WalletIdentity }
  | { ok: false; reason: WalletVerificationFailureReason }

/** API contract — POST /v1/wallet/challenge */
export type CreateWalletChallengeRequest = {
  address: string
}

export type CreateWalletChallengeResponse = {
  challenge: {
    id: string
    address: string
    message: string
    expires_at: string
  }
}

/** API contract — POST /v1/wallet/verify */
export type VerifyWalletSignatureRequest = {
  challenge_id: string
  signature: string
}

export type VerifyWalletSignatureResponse = {
  wallet: WalletIdentity
}

/** API contract — GET /v1/wallets */
export type ListLinkedWalletsResponse = {
  wallets: WalletIdentity[]
}

/** API contract — DELETE /v1/wallet/:id */
export type UnlinkWalletResponse = {
  wallet: WalletIdentity
}
