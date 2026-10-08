# Realtime staking: frontend-only RPC path

This folder holds the **singleton JsonRpc (HTTP) + optional WebSocket** read path for staking vault data. Wallet `BrowserProvider` is not used for bulk reads.

## Modules

| Module | Role |
|--------|------|
| `stakingReadProviders.ts` | `getStakingJsonRpcProvider()`, optional WS, block number refs, capability probe, reconnect owner |
| `stakingReadFactory.ts` | Cached ERC20 / vault contract instances, fast vs slow reads with timeouts, `lastHealthyRpcAtRef` |
| `stakingRefreshOrchestrator.ts` | Single-flight refresh, semantic coalescing, `performance.now()` floors, visibility wake |
| `stakingRefreshMetrics.ts` | Monotonic counters; `getStakingRefreshMetricsSnapshot()` for dev/support (no React subscription) |
| `profitManagerStatusSingleton.ts` | One Firestore listener for profit manager config; ref-counted |

## RPC / render estimates (order of magnitude)

- **Cold start:** one provider probe + first orchestrator tick batches vault + token reads (bounded parallel with timeouts).
- **Steady state:** refreshes are **coalesced**; minimum intervals apply per reason class (fast vs slow vs profit-related strings).
- **WS:** updates **block refs and timing only**; the orchestrator does **not** run full `refreshBalances` on every block.
- **Rerenders:** vault context updates only on **committed** snapshot from the orchestrator; profit status uses `useSyncExternalStore` on the singleton.

## Env

- `VITE_STAKING_RPC_HTTP_URL` — primary HTTP JSON-RPC (existing).
- `VITE_STAKING_WS_URL` — optional WebSocket URL for block observation (`STAKING_RPC_WS_URL` in `env.ts`).

## Remaining bottlenecks (operational)

- Vendor rate limits on shared public RPC.
- Firestore latency for profit schedule (single shared subscription mitigates duplicate listeners).
- Wallet signing path still uses injected provider (by design).

## Manual acceptance

- Network tab: no unbounded `eth_call` spikes on tab focus or block ticks.
- Long session: no growing listener count (WS reconnect path clears previous listeners).
- Wrong network / disconnect: orchestrator stops; no orphaned timers from staking refresh.
