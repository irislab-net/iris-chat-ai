/**
 * Stub for optional Coinbase CDP `@x402/*` payment helpers pulled in by Reown AppKit.
 * Staking does not use x402; empty modules keep Turbopack from failing on missing deps.
 */

export const x402Client = {}
export const ExactSvmScheme = {}
export function registerExactSvmScheme() {}
export function cdpSolanaAccountToSvmSigner() {
  return null
}

export default {}
