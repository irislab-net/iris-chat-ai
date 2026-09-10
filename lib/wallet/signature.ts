import { createHmac, timingSafeEqual } from "node:crypto"

export type WalletSignatureInput = {
  message: string
  signature: string
  address: string
}

/** Isolated verification boundary — swap implementation when wallet library is chosen. */
export interface WalletSignatureVerifier {
  verify(input: WalletSignatureInput): boolean | Promise<boolean>
}

/** Fail closed until a production verifier (EIP-191 / EIP-712) is wired. */
export class UnavailableWalletSignatureVerifier implements WalletSignatureVerifier {
  verify(): boolean {
    return false
  }
}

/** Test-only verifier using HMAC — not for production. */
export class HmacWalletSignatureVerifier implements WalletSignatureVerifier {
  constructor(private readonly secret: string) {}

  verify(input: WalletSignatureInput): boolean {
    const expected = createHmac("sha256", this.secret)
      .update(`${input.address}:${input.message}`)
      .digest("hex")
    const provided = input.signature.trim()
    if (expected.length !== provided.length) return false
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
  }
}

export function signTestWalletMessage(
  secret: string,
  input: WalletSignatureInput
): string {
  return createHmac("sha256", secret)
    .update(`${input.address}:${input.message}`)
    .digest("hex")
}
