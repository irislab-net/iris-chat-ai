# Staking ETH/USD (Chainlink) — engineering notes

## Architecture

- **Gas / wei path (unchanged):** `estimateStakingGasFee` → `maxFeeWei` → smoothing (`currentWeiRef`) → display string.
- **USD path (new):** `readChainlinkEthUsdLatest` → `ethUsdPriceCache` (singleton, TTL + ref-count) → `useStakingEthUsdPresentation(enabled)` → `buildNetworkFeeDisplayLine`.
- **No coupling:** Feed reads never touch `gasResultCache`, `estimateGas`, or tx submission. Cache keys and RPC estimate cadence are unchanged.

## Feed caching model

- **Keyed implicitly** by staking chain (`STAKING_CHAIN_ID` + `resolveChainlinkEthUsdFeedAddress`).
- **TTL:** `VITE_ETH_USD_CACHE_TTL_MS` (default 60s, clamp 30s–120s).
- **Inflight dedupe:** single `refreshStakingEthUsdPrice` flight unless superseded.
- **Visibility:** interval ticks skip when `document.hidden`; `visibilitychange` → visible triggers one refresh.
- **Subscriber ref-count:** polling starts on first `useStakingEthUsdPresentation(true)`; stops when last unsubscribes.

## Bigint math

- `microUsd = floor(maxFeeWei × answer × 1e6 / (1e18 × 10^feedDecimals))` in `computeEthFeeMicroUsd`.
- **Display:** nearest-cent string from micro-USD integer division only (`formatMicroUsdParen`).

## Rerender protections

- Gas hooks **do not** subscribe to USD when `enabled === false` (no transport).
- `runEstimateInternal` deps **exclude** ETH/USD; USD changes update `formatFeeLine` / `feeDisplayLine` `useMemo` only.
- Smoothing uses **`ethUsdRef`** + **`ethUsdPresentationKey`** effect to re-append USD **without** resetting wei / rAF targets.

## Remaining edge cases

- **Two-step deposit:** frozen `feeDisplayLine` at submit still reflects **first** tx (approve) estimate; USD is live-at-freeze-time.
- **Persisted modal `feeLine`:** plain string in sessionStorage; if the app version changes format, old strings still render as text (no crash).
- **Wrong wallet network:** gas `enabled` is usually false → no USD subscription; ETH-only path is `{ kind: "none" }`.

## QA checklist

1. With valid staking RPC + known chain: fee row shows `~x ETH ($y.yy)` after ≤1 TTL.
2. Unsupported chain + no `VITE_CHAINLINK_ETH_USD_FEED`: ETH-only line, no crash.
3. Toggle `VITE_DEBUG_LOGS`: confirm `[ethUsdCache]` / `[ethUsdFeed]` logs on refresh and RPC failure.
4. Background tab: no interval refresh until visible (watch network).
5. Deposit + withdraw both open (if possible): single poll cadence (not doubled).
6. `prepareSubmit` freeze: line stable through submit; USD matches snapshot at freeze.
7. Sub-cent fees: display `($0.00)` without long decimals.
