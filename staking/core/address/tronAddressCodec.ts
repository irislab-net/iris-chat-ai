import type { AddressCodec } from "@/staking/core/address/codecs"
import type { AccountId, AddressEqualityKey, NormalizedAddress } from "@/staking/core/address/types"

/**
 * Tron base58 account codec (Phase 17, **no ethers**).
 *
 * **Case sensitivity:** Tron addresses are base58 — **never** lowercase for equality or storage keys.
 * `equalityKey` is identical to `canonical` (trimmed wire form).
 *
 * **Wire shape:** mainnet-style accounts are `T` + 33 base58 characters (34 total), excluding `0`, `O`,
 * `I`, `l` from the alphabet (standard Base58).
 */
const TRON_ACCOUNT = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

export function createTronAddressCodec(): AddressCodec {
  function tryParse(raw: string): NormalizedAddress | null {
    const canonical = raw.trim()
    if (!canonical || !TRON_ACCOUNT.test(canonical)) return null
    const equalityKey = canonical as AddressEqualityKey
    return { family: "tron", canonical, equalityKey }
  }

  return {
    family: "tron",
    tryParse,
    isValid(raw: string): boolean {
      return tryParse(raw) !== null
    },
    toAccountId(normalized: NormalizedAddress, caip2: string): AccountId {
      const c = caip2.trim()
      return `${c}:${normalized.equalityKey}` as AccountId
    },
  }
}
