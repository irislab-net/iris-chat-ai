# Lighthouse Performance Report
**Date:** 2026-09-22  
**Tool:** Lighthouse 13.5.0 (headless Chrome)  
**Categories:** performance only

Raw artifacts:
- `exur-ai.report.html` / `exur-ai.report.json`
- `chat-exur-ai.report.html` / `chat-exur-ai.report.json`
- `summary.json`

---

## Scores

| Site | Perf score | FCP | LCP | TBT | CLS | Speed Index | TTI |
|------|------------|-----|-----|-----|-----|-------------|-----|
| **exur.ai** | **78** | 3.1s | 3.1s | 130ms | 0.046 | 10.8s | 11.7s |
| **chat.exur.ai** | **56** | 5.7s | 12.1s | 100ms | 0.003 | 8.8s | 16.5s |

---

## Root causes (shared)

### 1. Slow TTFB (server / edge)
- **exur.ai:** document ~770ms (LCP TTFB subpart ~1.5s in breakdown)
- **chat.exur.ai:** document ~1.4s

Frontend can only partially mask this (streaming / lighter RSC). Needs deploy/CDN/cache work too.

### 2. Unused / early third-party JS
| Script | Where | Waste |
|--------|--------|-------|
| `gtag/js?id=G-GLTQZ1G6RX` | both | ~73–75 KiB unused |
| `gtm.js?id=GTM-KMGLCNZD` | chat | ~76 KiB unused |
| `accounts.google.com/gsi/client` | chat | ~76 KiB unused |
| Next chunks (`3bk0-…`, `1uvq4m…`, …) | both | ~20–75 KiB each |

**chat.exur.ai** estimated unused JS savings: **~400 KiB**  
**exur.ai** estimated unused JS savings: **~237 KiB**

### 3. Main-thread cost
- **exur.ai:** 5.6s main-thread (Style & Layout **2.4s**, Script eval **1.3s**)
- **chat.exur.ai:** 2.6s main-thread

### 4. LCP elements
- **exur.ai:** hero `h1` (render delay after TTFB)
- **chat.exur.ai:** desk empty-state copy (`p.mt-1`) — late because heavy JS before paint settles

---

## Cursor fix plan (frontend)

### High priority
1. **Idle-defer GA + GTM** on chat (marketing GA already idle-gated).
2. **Skip standalone gtag on chat when GTM is on** — avoid double analytics stack (~172KB + 115KB).
3. **Idle-defer Google One Tap / GIS** until after first idle or ~3–4s.
4. Keep landing chat islands lazy (already partially done).

### Medium
5. Reduce marketing Style & Layout work (goals ticker pause when off-screen — done; review GSAP ScrollTriggers).
6. Fonts: avoid shipping unused IRIS Sans faces on LTR chat when possible.

### Platform / not pure frontend
7. Improve HTML TTFB (cache headers, region, Fluid Compute warmup, ISR already 900s on `/home`).

---

## Commands used

```bash
lighthouse https://exur.ai --only-categories=performance \
  --output=json --output=html --output-path=./exur-ai \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

lighthouse https://chat.exur.ai --only-categories=performance \
  --output=json --output=html --output-path=./chat-exur-ai \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```
