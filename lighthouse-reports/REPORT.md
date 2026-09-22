# Lighthouse Performance Report
**Date:** 2026-09-22  
**Tool:** Lighthouse 13.5.0 (headless Chrome)  
**Categories:** performance only

Raw artifacts:
- Baseline: `exur-ai.report.*` / `chat-exur-ai.report.*`
- Rerun: `*-rerun.report.*`
- **v3 (latest):** `exur-ai-v3.report.*` / `chat-exur-ai-v3.report.*`
- Compare: `compare-v3.json`

---

## Scores (timeline)

| Site | Baseline | Rerun | **v3** | Notes |
|------|----------|-------|--------|-------|
| **exur.ai** | 78 | 80 | **59** | TTFB spiked to **2.4s** (was ~0.7s); Style & Layout **6.7s** |
| **chat.exur.ai** | 56 | 32 | **35** | TBT still **1.7s**; GTM+gtag+GIS all still load in-window |

### v3 metrics

| Site | FCP | LCP | TBT | CLS | SI | TTI | TTFB |
|------|-----|-----|-----|-----|----|-----|------|
| exur.ai | 2.7s | 2.7s | 1.1s | 0.045 | 11.0s | 11.4s | **2.4s** |
| chat.exur.ai | 3.9s | 7.6s | **1.7s** | 0.003 | 7.0s | 12.0s | 1.4s |

---

## Root causes from v3 (debug)

### 1. Production is behind local main (critical)
Live `GoogleAnalytics` chunk still uses:

`isAnalyticsEnabled() && hostname && (!isMarketing || idleReady)`

On **chat** that means **standalone gtag loads immediately** (no GTM skip). Network confirms gtag starts ~4s **before** GTM.

### 2. `requestIdleCallback` defeats deferral
`rIC(fn, { timeout: N })` runs as soon as the thread is quiet — Lighthouse quiet windows arm GA/GTM/GIS early. Same for `scroll` listeners (LH scrolls during audits).

### 3. Dual analytics on chat (~320 KiB)
| Script | Transfer | Unused |
|--------|----------|--------|
| gtag.js | ~172 KiB | ~71 KiB |
| gtm.js | ~115 KiB | ~74 KiB |
| gsi/client | ~99 KiB | ~74 KiB |

### 4. Chat LCP
Empty-state copy (`p.mt-1`) — TTFB ~1.8s + **element render delay ~1.8s** (JS before paint settles).

### 5. Marketing main-thread
Style & Layout **6.7s**, Script Evaluation **3.8s**. LCP is hero `h1` dominated by TTFB.

---

## Fixes applied locally (need deploy)

1. **`useIdleReady`**: `setTimeout` only — no `requestIdleCallback`, no `scroll`; default **15s** + real pointer/key/touch.
2. **GA hard-skip on `chat.exur.ai`** (+ existing GTM path skip).
3. **GTM / GIS** share the same defer hook (15s / interaction).
4. Prior lazy-split / skeleton / sample-prompt work remains on `main`.

### Still platform / after deploy
5. Re-run Lighthouse **after Cloudflare deploy** of these commits.
6. TTFB (0.7–2.4s) — edge/cache/origin; frontend can only mask partially.

---

## Commands

```bash
cd lighthouse-reports
lighthouse https://exur.ai --only-categories=performance \
  --output=json --output=html --output-path=./exur-ai-v3 \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

lighthouse https://chat.exur.ai --only-categories=performance \
  --output=json --output=html --output-path=./chat-exur-ai-v3 \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```
