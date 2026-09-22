# Lighthouse Full Audit (Perf + A11y + Best Practices + SEO)
**Date:** 2026-09-22  
**Tool:** Lighthouse 13.5.0  
**Artifacts:** `exur-ai-full.report.*` / `chat-exur-ai-full.report.*` / `full-summary.json`

## Scores (production before this fix batch)

| Site | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| **exur.ai** | **83** | **100** | **96** | **100** |
| **chat.exur.ai** | **67** | **100** | **92** | **66** |

## Failures → fixes

### Accessibility
Clean on both hosts (no code changes).

### SEO (chat 66)
- **Cause:** `<meta name="robots" content="noindex, nofollow">` on desk `/`
- **Fix:** Desk metadata now uses `ROOT_ROBOTS` (`index, follow`) with chat canonical

### Best Practices
| Issue | Host | Fix |
|-------|------|-----|
| Console `400` on `/v1/auth/refresh` | both | Proxy returns **204** when no `refresh_token` cookie |
| CSP blocks `accounts.google.com/gsi/style` | chat | `style-src` allowlist includes `https://accounts.google.com` |
| GIS “Not signed in…” | chat | Already deferred via interaction/`15s` (needs deploy) |

### Performance (still mostly deploy + platform)
| Issue | Notes |
|-------|--------|
| Dual gtag+GTM on chat | Local skip is on `main`; production chunk was still old at audit time |
| Unused JS / TTFB / CSS | Bundle + edge; TTFB improved on chat (250ms) this run |
| Marketing Style & Layout | Landing motion cost — separate pass |

## Re-run after deploy

```bash
cd lighthouse-reports
lighthouse https://exur.ai --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html --output-path=./exur-ai-full \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
lighthouse https://chat.exur.ai --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html --output-path=./chat-exur-ai-full \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```
