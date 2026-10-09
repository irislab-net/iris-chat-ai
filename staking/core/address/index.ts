/**
 * # Address / account identity foundation (Phase 9)
 *
 * **Scope:** pure types + codecs only. No runtime wiring to wallet, persistence, referral,
 * Firestore, or cache keys yet.
 *
 * ## Codecs (Phase 17)
 *
 * - **`createEvmAddressCodec`** — hex via **ethers**; `equalityKey` is **lowercase** hex — **never** use
 *   for Tron base58 strings.
 * - **`createTronAddressCodec`** — base58 `T…` accounts; **`equalityKey === canonical`** (trimmed wire
 *   form) — **case-sensitive**; **no** lowercase normalization.
 *
 * ## Audit — dangerous lowercase & EVM-only assumptions (current codebase)
 *
 * ### `src/staking/tx/stakingTxSessionPersistence.ts`
 * - `normalizePersistAddress` → **lowercase hex** — correct for EVM only; **unsafe for Tron**.
 * - `sessionMatchesWallet` — legacy normalized hex + numeric `chainId` — EVM-only.
 * - `sessionMatchesAccount` — prefers `hydratedSessionAccountId` (v2 dual-read) vs live-derived EVM
 *   `accountId`, then falls back to `sessionMatchesWallet` — still **EVM-only** today.
 *
 * ### `src/lib/stakingReferralAddress.ts`
 * - `ethers.isAddress` / `getAddress` — **EVM-only** referral acceptance.
 *
 * ### `src/hooks/useAffiliateFirestoreStats.ts`
 * - Doc id via `getAddress(address)` / lowercase cache keys — **EVM Firestore paths**.
 *
 * ### `src/lib/affiliateFirestoreStats.ts`
 * - Collection name from env vault; doc ids normalized per `AFFILIATE_FIRESTORE_ADDRESS_FORMAT` — **EVM**.
 *
 * ### `src/hooks/useWallet.tsx`
 * - `shortAddress` uses `slice` on hex-style strings; `isEthereumNetwork` / `isSolanaNetwork` — no Tron.
 *
 * ### Cache keys (gas, history, read factory — prior phases)
 * - EVM `toLowerCase()` on **hex** contract/wallet strings — **do not** apply to Tron base58.
 *
 * ### Referral / query capture
 * - Same EVM address rules as `stakingReferralAddress`.
 *
 * ## Tron restore / runtime (not yet)
 * - Needs Tron receipt RPC, wallet, persistence matching — **after** dormant registry + codec land.
 *
 * ## Deployment model (Phase 13–17)
 * - **CAIP-2:** `eip155:*` vs `tron:*` namespaces must not be conflated; runtime keys include **`chainFamily`**
 *   (`providerRuntime.ts`, `types.ts`). Tron deployments may be **valid + ingested** but remain **non-executable**
 *   until a dedicated activation phase.
 */

export type { AccountId, AddressEqualityKey, NormalizedAddress } from "@/staking/core/address/types"
export type { AddressCodec } from "@/staking/core/address/codecs"
export { createEvmAddressCodec } from "@/staking/core/address/evmAddressCodec"
export { createTronAddressCodec } from "@/staking/core/address/tronAddressCodec"
