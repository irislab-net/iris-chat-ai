import { normalizeWalletAddress } from "@/lib/wallet/address"
import type { WalletSignatureVerifier } from "@/lib/wallet/signature"
import type {
  WalletAuditEvent,
  WalletChallenge,
  WalletIdentity,
  WalletVerificationResult,
} from "@/lib/wallet/types"

const DEFAULT_TTL_MS = 5 * 60_000

export type ChallengeStore = {
  get(id: string): WalletChallenge | undefined
  save(challenge: WalletChallenge): void
  isUsed(id: string): boolean
  markUsed(id: string): void
}

export class InMemoryChallengeStore implements ChallengeStore {
  private readonly challenges = new Map<string, WalletChallenge>()
  private readonly used = new Set<string>()

  get(id: string): WalletChallenge | undefined {
    return this.challenges.get(id)
  }

  save(challenge: WalletChallenge): void {
    this.challenges.set(challenge.id, challenge)
  }

  isUsed(id: string): boolean {
    return this.used.has(id)
  }

  markUsed(id: string): void {
    this.used.add(id)
  }
}

function randomNonce(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildWalletChallengeMessage(input: {
  domain: string
  address: string
  nonce: string
  issuedAt: number
  expiresAt: number
}): string {
  return [
    `${input.domain} wants you to verify wallet ownership.`,
    "",
    `Address: ${input.address}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${new Date(input.issuedAt).toISOString()}`,
    `Expires At: ${new Date(input.expiresAt).toISOString()}`,
  ].join("\n")
}

export function createWalletChallenge(input: {
  userId: string
  address: string
  store: ChallengeStore
  domain?: string
  now?: number
  ttlMs?: number
  challengeId?: string
}): WalletChallenge {
  const now = input.now ?? Date.now()
  const expiresAt = now + (input.ttlMs ?? DEFAULT_TTL_MS)
  const address = normalizeWalletAddress(input.address)
  const nonce = randomNonce()
  const challenge: WalletChallenge = {
    id: input.challengeId ?? randomNonce(),
    userId: input.userId,
    address,
    nonce,
    expiresAt,
    createdAt: now,
    message: buildWalletChallengeMessage({
      domain: input.domain ?? "IRIS",
      address,
      nonce,
      issuedAt: now,
      expiresAt,
    }),
  }
  input.store.save(challenge)
  return challenge
}

export function verifyWalletChallenge(input: {
  challengeId: string
  signature: string
  store: ChallengeStore
  verifier: WalletSignatureVerifier
  now?: number
  onAudit?: (event: WalletAuditEvent) => void
}): WalletVerificationResult {
  const now = input.now ?? Date.now()
  const challenge = input.store.get(input.challengeId)
  if (!challenge) {
    input.onAudit?.({
      type: "WALLET_VERIFICATION_FAILED",
      userId: "unknown",
      walletIdentityId: null,
      address: null,
      challengeId: input.challengeId,
      reason: "CHALLENGE_NOT_FOUND",
      occurredAt: now,
    })
    return { ok: false, reason: "CHALLENGE_NOT_FOUND" }
  }
  if (input.store.isUsed(input.challengeId)) {
    input.onAudit?.({
      type: "WALLET_VERIFICATION_FAILED",
      userId: challenge.userId,
      walletIdentityId: null,
      address: challenge.address,
      challengeId: challenge.id,
      reason: "CHALLENGE_ALREADY_USED",
      occurredAt: now,
    })
    return { ok: false, reason: "CHALLENGE_ALREADY_USED" }
  }
  if (challenge.expiresAt <= now) {
    input.onAudit?.({
      type: "WALLET_VERIFICATION_FAILED",
      userId: challenge.userId,
      walletIdentityId: null,
      address: challenge.address,
      challengeId: challenge.id,
      reason: "CHALLENGE_EXPIRED",
      occurredAt: now,
    })
    return { ok: false, reason: "CHALLENGE_EXPIRED" }
  }

  const valid = input.verifier.verify({
    message: challenge.message,
    signature: input.signature,
    address: challenge.address,
  })
  if (!valid) {
    input.onAudit?.({
      type: "WALLET_VERIFICATION_FAILED",
      userId: challenge.userId,
      walletIdentityId: null,
      address: challenge.address,
      challengeId: challenge.id,
      reason: "INVALID_SIGNATURE",
      occurredAt: now,
    })
    return { ok: false, reason: "INVALID_SIGNATURE" }
  }

  input.store.markUsed(input.challengeId)
  const identity = linkVerifiedWalletIdentity({
    userId: challenge.userId,
    address: challenge.address,
    now,
  })
  input.onAudit?.({
    type: "WALLET_VERIFIED",
    userId: challenge.userId,
    walletIdentityId: identity.id,
    address: identity.address,
    challengeId: challenge.id,
    reason: null,
    occurredAt: now,
  })
  input.onAudit?.({
    type: "WALLET_LINKED",
    userId: challenge.userId,
    walletIdentityId: identity.id,
    address: identity.address,
    challengeId: challenge.id,
    reason: null,
    occurredAt: now,
  })
  return { ok: true, identity }
}

export function linkVerifiedWalletIdentity(input: {
  userId: string
  address: string
  now?: number
  identityId?: string
}): WalletIdentity {
  const now = input.now ?? Date.now()
  const iso = new Date(now).toISOString()
  const address = normalizeWalletAddress(input.address)
  return {
    id: input.identityId ?? `wallet:${input.userId}:${address}`,
    userId: input.userId,
    address,
    lifecycle: "VERIFIED",
    verifiedAt: iso,
    revokedAt: null,
    createdAt: iso,
    updatedAt: iso,
  }
}

export function revokeWalletIdentity(
  identity: WalletIdentity,
  now = Date.now()
): WalletIdentity {
  const iso = new Date(now).toISOString()
  return {
    ...identity,
    lifecycle: "REVOKED",
    revokedAt: iso,
    updatedAt: iso,
  }
}

export function markWalletChanged(
  identity: WalletIdentity,
  now = Date.now()
): WalletIdentity {
  const iso = new Date(now).toISOString()
  return {
    ...identity,
    lifecycle: "CHANGED",
    verifiedAt: null,
    updatedAt: iso,
  }
}
