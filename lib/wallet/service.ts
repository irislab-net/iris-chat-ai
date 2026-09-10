import { apiJson } from "@/lib/api/client"
import type {
  CreateWalletChallengeRequest,
  CreateWalletChallengeResponse,
  ListLinkedWalletsResponse,
  UnlinkWalletResponse,
  VerifyWalletSignatureRequest,
  VerifyWalletSignatureResponse,
  WalletIdentity,
} from "@/lib/wallet/types"

function unwrapWalletIdentity(raw: unknown): WalletIdentity {
  if (!raw || typeof raw !== "object") {
    throw new Error("Malformed wallet identity response")
  }
  const value = raw as Record<string, unknown>
  return {
    id: String(value.id),
    userId: String(value.userId ?? value.user_id),
    address: String(value.address),
    lifecycle: value.lifecycle as WalletIdentity["lifecycle"],
    verifiedAt: (value.verifiedAt ?? value.verified_at ?? null) as string | null,
    revokedAt: (value.revokedAt ?? value.revoked_at ?? null) as string | null,
    createdAt: String(value.createdAt ?? value.created_at),
    updatedAt: String(value.updatedAt ?? value.updated_at),
  }
}

function unwrapEnvelope<T>(body: unknown, pick: (value: Record<string, unknown>) => T): T {
  if (!body || typeof body !== "object") {
    throw new Error("Malformed API response")
  }
  const record = body as Record<string, unknown>
  if (record.data && typeof record.data === "object") {
    return pick(record.data as Record<string, unknown>)
  }
  return pick(record)
}

/** Backend contract — wallet ownership verification endpoints. */
export async function createWalletChallenge(
  request: CreateWalletChallengeRequest
): Promise<CreateWalletChallengeResponse> {
  const body = await apiJson<unknown>("/v1/wallet/challenge", {
    method: "POST",
    body: JSON.stringify(request),
  })
  return unwrapEnvelope(body, (data) => {
    const challenge = data.challenge as Record<string, unknown>
    return {
      challenge: {
        id: String(challenge.id),
        address: String(challenge.address),
        message: String(challenge.message),
        expires_at: String(challenge.expires_at),
      },
    }
  })
}

export async function verifyWalletSignature(
  request: VerifyWalletSignatureRequest
): Promise<VerifyWalletSignatureResponse> {
  const body = await apiJson<unknown>("/v1/wallet/verify", {
    method: "POST",
    body: JSON.stringify(request),
  })
  return unwrapEnvelope(body, (data) => ({
    wallet: unwrapWalletIdentity(data.wallet),
  }))
}

let walletsInFlight: Promise<ListLinkedWalletsResponse> | null = null

export async function listLinkedWallets(): Promise<ListLinkedWalletsResponse> {
  if (walletsInFlight) return walletsInFlight

  walletsInFlight = (async () => {
    try {
      const body = await apiJson<unknown>("/v1/wallets")
      return unwrapEnvelope(body, (data) => ({
        wallets: Array.isArray(data.wallets)
          ? data.wallets.map((wallet) => unwrapWalletIdentity(wallet))
          : [],
      }))
    } finally {
      walletsInFlight = null
    }
  })()

  return walletsInFlight
}

export async function unlinkWallet(walletId: string): Promise<UnlinkWalletResponse> {
  const body = await apiJson<unknown>(`/v1/wallet/${encodeURIComponent(walletId)}`, {
    method: "DELETE",
  })
  return unwrapEnvelope(body, (data) => ({
    wallet: unwrapWalletIdentity(data.wallet),
  }))
}
