import type { Provider } from "@reown/appkit-adapter-ethers"
import { BrowserProvider, type Signer } from "ethers"

export type EvmAccountsProbeFailureReason =
  | "non_array"
  | "empty"
  | "malformed_address"
  | "request_failed"

export type EvmAccountsProbeResult =
  | { ok: true; accounts: readonly string[] }
  | { ok: false; reason: EvmAccountsProbeFailureReason }

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

export function isMobileWalletUserAgent(): boolean {
  if (typeof navigator === "undefined") return false
  return /android|iphone|ipad|mobile/i.test(navigator.userAgent)
}

/** Validate `eth_accounts` before `getSigner` — Trust Wallet can return partial garbage after resume. */
export async function probeEip155EthAccounts(
  walletProvider: Provider
): Promise<EvmAccountsProbeResult> {
  try {
    const raw = await walletProvider.request({ method: "eth_accounts" })
    if (!Array.isArray(raw)) {
      return { ok: false, reason: "non_array" }
    }
    const accounts = raw.filter((a): a is string => typeof a === "string")
    if (accounts.length === 0) {
      return { ok: false, reason: "empty" }
    }
    for (const account of accounts) {
      if (!EVM_ADDRESS_RE.test(account.trim())) {
        return { ok: false, reason: "malformed_address" }
      }
    }
    return { ok: true, accounts }
  } catch {
    return { ok: false, reason: "request_failed" }
  }
}

export function appKitAddressMatchesEthAccounts(
  appKitAddress: string,
  accounts: readonly string[]
): boolean {
  const expected = appKitAddress.trim().toLowerCase()
  if (!expected) return false
  return accounts.some(a => a.trim().toLowerCase() === expected)
}

export type ResolveEvmSignerResult =
  | { ok: true; provider: BrowserProvider; signer: Signer }
  | { ok: false; reason: string; error: unknown }

/** Lag / handoff / timeout — not treated as confirmed WC session death. */
export function isTransientEvmSignerHydrationFailure(input: Readonly<{
  reason: string
  error: unknown
}>): boolean {
  const reason = input.reason.trim()
  if (reason.startsWith("eth_accounts:empty")) return true
  if (reason.startsWith("eth_accounts:request_failed")) return true
  if (/getSigner_timeout/i.test(reason)) return true
  if (input.error instanceof Error) {
    if (input.error.name === "AbortError") return true
    if (/timeout/i.test(input.error.message)) return true
    if (/abort/i.test(input.error.message)) return true
  }
  return false
}

function withOptionalTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  if (timeoutMs <= 0) return promise
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label}_timeout`))
    }, timeoutMs)
    promise.then(
      value => {
        window.clearTimeout(timer)
        resolve(value)
      },
      err => {
        window.clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/**
 * Hydrate ethers signer from AppKit EIP-155 provider.
 * Mobile: bounded `getSigner` wait so deep-link hangs surface as recoverable failures.
 */
export async function resolveEvmSignerFromWalletProvider(input: Readonly<{
  walletProvider: Provider
  expectedAddress: string
  mobileSignerTimeoutMs?: number
}>): Promise<ResolveEvmSignerResult> {
  const probe = await probeEip155EthAccounts(input.walletProvider)
  if (!probe.ok) {
    return {
      ok: false,
      reason: `eth_accounts:${probe.reason}`,
      error: new Error(`eth_accounts:${probe.reason}`),
    }
  }

  if (!appKitAddressMatchesEthAccounts(input.expectedAddress, probe.accounts)) {
    return {
      ok: false,
      reason: "eth_accounts:address_mismatch",
      error: new Error("eth_accounts:address_mismatch"),
    }
  }

  const provider = new BrowserProvider(input.walletProvider)
  const timeoutMs =
    input.mobileSignerTimeoutMs ??
    (isMobileWalletUserAgent() ? 45_000 : 0)

  try {
    const signer = await withOptionalTimeout(
      provider.getSigner(),
      timeoutMs,
      "getSigner"
    )
    return { ok: true, provider, signer }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "getSigner_failed",
      error,
    }
  }
}
