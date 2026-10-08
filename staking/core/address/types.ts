import type { ChainFamily } from "@/staking/core/types"

/**
 * Stable string for **equality only** within a chain family.
 * For EVM: lowercase hex (0x…). Tron will use a different rule — **never** lowercase base58.
 */
export type AddressEqualityKey = string & { readonly __brand: "AddressEqualityKey" }

/**
 * Namespaced account identifier, e.g. `eip155:1:0xabc…` (format is family-specific).
 * FUTURE: persistence / affiliate keys may migrate to this shape.
 */
export type AccountId = string & { readonly __brand: "AccountId" }

/** Parsed address in canonical wire + equality forms. */
export type NormalizedAddress = {
  family: ChainFamily
  /** Wire form: EVM EIP-55 hex (`ethers.getAddress`) or Tron trimmed base58 (`tronAddressCodec`). */
  canonical: string
  equalityKey: AddressEqualityKey
}
