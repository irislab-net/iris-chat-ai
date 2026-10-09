import { getAddress, isAddress } from "ethers"
import type { AddressCodec } from "@/staking/core/address/codecs"
import type { AccountId, AddressEqualityKey, NormalizedAddress } from "@/staking/core/address/types"

/**
 * EVM hex codec: canonical EIP-55 checksumming, equality via lowercase hex.
 *
 * **Why `equalityKey` is lowercase hex:** legacy staking compares `0x…` strings after
 * `.toLowerCase()` (EVM-only). Tron base58 addresses are **case-sensitive** — they must not
 * use this key strategy.
 *
 * **Why `AccountId` exists:** a single string namespace for “who” across deployments and
 * families, without overloading raw `walletAddress` strings.
 *
 * **Deployment network identity (Phase 13):** vault/contract **addresses** here are EVM hex; the
 * **chain** for a deployment row is **CAIP-2 + `chainFamily`** (`types.ts`, `providerRuntime.ts`),
 * not a bare numeric id across families.
 */
export function createEvmAddressCodec(): AddressCodec {
  function tryParse(raw: string): NormalizedAddress | null {
    const t = raw.trim()
    if (!t || !isAddress(t)) return null
    try {
      const canonical = getAddress(t)
      const equalityKey = canonical.toLowerCase() as AddressEqualityKey
      return { family: "evm", canonical, equalityKey }
    } catch {
      return null
    }
  }

  return {
    family: "evm",
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
