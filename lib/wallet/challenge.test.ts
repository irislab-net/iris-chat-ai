import { describe, expect, it } from "vitest"

import {
  createWalletChallenge,
  InMemoryChallengeStore,
  markWalletChanged,
  revokeWalletIdentity,
  verifyWalletChallenge,
} from "@/lib/wallet/challenge"
import {
  HmacWalletSignatureVerifier,
  signTestWalletMessage,
} from "@/lib/wallet/signature"
import {
  primaryWalletIdentity,
  verifiedWalletAddress,
  walletReadinessStatus,
} from "@/lib/wallet/identity"
import type { WalletIdentity } from "@/lib/wallet/types"

const USER_ID = "user-1"
const ADDRESS = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01"
const SECRET = "test-secret"

describe("wallet challenge verification", () => {
  it("verifies a signed challenge and marks it used", () => {
    const store = new InMemoryChallengeStore()
    const verifier = new HmacWalletSignatureVerifier(SECRET)
    const challenge = createWalletChallenge({
      userId: USER_ID,
      address: ADDRESS,
      store,
      now: 1_000,
      challengeId: "challenge-1",
    })
    const signature = signTestWalletMessage(SECRET, {
      message: challenge.message,
      signature: "",
      address: challenge.address,
    })

    const result = verifyWalletChallenge({
      challengeId: challenge.id,
      signature,
      store,
      verifier,
      now: 2_000,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.identity.lifecycle).toBe("VERIFIED")
      expect(result.identity.address).toBe(ADDRESS.toLowerCase())
    }
    expect(store.isUsed(challenge.id)).toBe(true)
  })

  it("rejects an invalid signature", () => {
    const store = new InMemoryChallengeStore()
    const challenge = createWalletChallenge({
      userId: USER_ID,
      address: ADDRESS,
      store,
      now: 1_000,
      challengeId: "challenge-2",
    })

    const result = verifyWalletChallenge({
      challengeId: challenge.id,
      signature: "bad-signature",
      store,
      verifier: new HmacWalletSignatureVerifier(SECRET),
      now: 2_000,
    })

    expect(result).toEqual({ ok: false, reason: "INVALID_SIGNATURE" })
  })

  it("rejects expired and replayed challenges", () => {
    const store = new InMemoryChallengeStore()
    const verifier = new HmacWalletSignatureVerifier(SECRET)
    const challenge = createWalletChallenge({
      userId: USER_ID,
      address: ADDRESS,
      store,
      ttlMs: 500,
      now: 1_000,
      challengeId: "challenge-3",
    })
    const signature = signTestWalletMessage(SECRET, {
      message: challenge.message,
      signature: "",
      address: challenge.address,
    })

    expect(
      verifyWalletChallenge({
        challengeId: challenge.id,
        signature,
        store,
        verifier,
        now: 2_000,
      })
    ).toEqual({ ok: false, reason: "CHALLENGE_EXPIRED" })

    const replay = createWalletChallenge({
      userId: USER_ID,
      address: ADDRESS,
      store,
      now: 1_000,
      challengeId: "challenge-4",
    })
    const replaySignature = signTestWalletMessage(SECRET, {
      message: replay.message,
      signature: "",
      address: replay.address,
    })
    verifyWalletChallenge({
      challengeId: replay.id,
      signature: replaySignature,
      store,
      verifier,
      now: 1_100,
    })
    expect(
      verifyWalletChallenge({
        challengeId: replay.id,
        signature: replaySignature,
        store,
        verifier,
        now: 1_200,
      })
    ).toEqual({ ok: false, reason: "CHALLENGE_ALREADY_USED" })
  })
})

describe("wallet identity readiness", () => {
  const verifiedIdentity: WalletIdentity = {
    id: "wallet-1",
    userId: USER_ID,
    address: ADDRESS.toLowerCase(),
    lifecycle: "VERIFIED",
    verifiedAt: "2026-01-01T00:00:00.000Z",
    revokedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }

  it("only exposes verified addresses to trading", () => {
    expect(verifiedWalletAddress(verifiedIdentity)).toBe(ADDRESS.toLowerCase())
    expect(
      verifiedWalletAddress({
        ...verifiedIdentity,
        lifecycle: "SIGNATURE_PENDING",
      })
    ).toBeNull()
  })

  it("maps lifecycle states to readiness statuses", () => {
    expect(
      walletReadinessStatus({ lifecycle: "NO_WALLET", address: null })
    ).toBe("MISSING")
    expect(
      walletReadinessStatus({ lifecycle: "SIGNATURE_PENDING", address: ADDRESS })
    ).toBe("UNVERIFIED")
    expect(
      walletReadinessStatus({ lifecycle: "VERIFIED", address: ADDRESS.toLowerCase() })
    ).toBe("VERIFIED")
    expect(
      walletReadinessStatus({ lifecycle: "REVOKED", address: ADDRESS.toLowerCase() })
    ).toBe("MISSING")
  })

  it("handles wallet change and unlink flows", () => {
    const changed = markWalletChanged(verifiedIdentity)
    expect(changed.lifecycle).toBe("CHANGED")
    expect(walletReadinessStatus({ lifecycle: changed.lifecycle, address: changed.address })).toBe(
      "UNVERIFIED"
    )

    const revoked = revokeWalletIdentity(verifiedIdentity)
    expect(revoked.lifecycle).toBe("REVOKED")
    expect(verifiedWalletAddress(revoked)).toBeNull()
  })

  it("prefers a verified wallet when listing identities", () => {
    const pending: WalletIdentity = {
      ...verifiedIdentity,
      id: "wallet-2",
      lifecycle: "SIGNATURE_PENDING",
      verifiedAt: null,
    }
    expect(primaryWalletIdentity([pending, verifiedIdentity])).toEqual(verifiedIdentity)
  })
})
