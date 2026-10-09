# Staking mobile / lifecycle stabilization (engineering summary)

## Root causes addressed

1. **Radix `Dialog` `onOpenChange(false)` on mobile** — WebKit and wallet deep-links fired close intents while `open` was still logically true for in-flight transactions. **Fix:** treat Radix `onOpenChange(false)` as non-authoritative; all real closes go through `closeUser`, `beginInFlightDismissal`, or programmatic `close()` from the provider epilogue.
2. **Preview phase unprotected** — Previously mitigated via a phase allow-list; the hardened approach ignores **all** Radix-driven `false` transitions so preview cannot be cleared by focus churn.
3. **Blind splash timer** — `InitialSplashOverlay` hid only on a wall-clock. **Fix:** gate on `AppKitReady` + staking vault hydration when on `/staking/app`, then apply a short minimum display; sessionStorage prevents splash replay on resume.
4. **Modal vs form desync** — Wallet/account/network changes reset form state but not tx modal. **Fix:** debounced disconnect/account detection in `useStakingFormLifecycle`; forms call `resetTransactionLifecycle()`; provider clears persistence and snapshot on identity drift while the modal is active.
5. **Transaction state loss on reload** — In-memory-only modal state. **Fix:** `sessionStorage` persistence (`stakingTxSessionPersistence.ts`) with TTL, wallet/chain guards, and optional RPC reconciliation (`stakingTxOnChainRecovery.ts`).

## Lifecycle changes

| Area | Behavior |
|------|----------|
| Tx dialog | Controlled exclusively by `TransactionStatusProvider` snapshot; Radix `onOpenChange(false)` no-op. |
| Persistence | Debounced writes while modal active; cleared on idle; hydrate after wallet reconnect matches session. |
| Bootstrap | `BootstrapOrchestrationProvider` + `reportStakingVaultHydrated` from `StakingVaultProvider`. |
| Vault refresh | `pageshow` with `persisted` triggers the same semantic refresh path as visibility changes. |
| Mobile resume | `stakingMobileResumeStore` tracks visibility / pagehide / pageshow / freeze / resume for diagnostics and optional suppression windows. |

## Persistence model

- **Key:** `waddle_staking_tx_session_v1` (`sessionStorage`).
- **Payload:** full `TransactionStatusSnapshot` plus `walletAddress`, `chainId`, `updatedAt`.
- **TTL:** 48h (`STAKING_TX_SESSION_TTL_MS`).
- **APIs:** `clearPersistedTransactionState()`, `resetTransactionLifecycle()` on `TransactionStatusContext`.

## Mobile handling model

1. **Synthetic dialog closes** — Ignored at Radix boundary; explicit UI handlers only.
2. **Resume coordinator** — Subscribable store for future tightening; DEV tracing in `TransactionStatusSurface`.
3. **Transient wallet flicker** — Debounced `onWalletDisconnect` (default 2.8s) and address change (600ms).

## Remaining risks

- **Multi-tab** — `sessionStorage` is per-tab; two tabs can diverge.
- **Receipt reconciliation** — Uses staking JSON-RPC only; reorg or indexer lag not modeled.
- **Preview gas after restore** — Restored preview may need gas row refresh (user can cancel and retry).

## Recommended QA

1. iOS Safari: open staking → preview → Confirm → wallet app → return; modal must remain until explicit dismiss or completion.
2. Android Chrome + MetaMask: same flow; toggle airplane mode briefly during `submitted`.
3. Hard reload mid-`submitted` with known tx hash; modal should restore and reconcile to confirmed/failed.
4. Switch wallet account during preview; debounced reset clears modal + form.
5. Navigate away from `/staking/app` and back; new session tab clears storage on idle between visits if user cleared.
