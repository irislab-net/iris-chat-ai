const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/

export class WalletAddressError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WalletAddressError"
  }
}

/** Lowercase EVM address for stable comparison and storage keys. */
export function normalizeWalletAddress(value: string): string {
  const trimmed = value.trim()
  if (!EVM_ADDRESS.test(trimmed)) {
    throw new WalletAddressError("Invalid EVM wallet address")
  }
  return trimmed.toLowerCase()
}

export function isValidWalletAddress(value: string | null | undefined): value is string {
  if (typeof value !== "string") return false
  try {
    normalizeWalletAddress(value)
    return true
  } catch {
    return false
  }
}
