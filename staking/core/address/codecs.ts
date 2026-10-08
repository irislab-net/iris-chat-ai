import type { ChainFamily } from "@/staking/core/types"
import type { AccountId, NormalizedAddress } from "@/staking/core/address/types"

/**
 * Family-scoped parse / validate / account-id construction.
 * **`createTronAddressCodec`** (Phase 17) complements EVM — do not share lowercase hex rules with Tron.
 */
export interface AddressCodec {
  readonly family: ChainFamily

  tryParse(raw: string): NormalizedAddress | null

  isValid(raw: string): boolean

  toAccountId(normalized: NormalizedAddress, caip2: string): AccountId
}
