# CWV baseline (PERF-001)

Measured 2026-09-25 with Lighthouse 13.5.0 (headless Chrome).

## Marketing — `https://exur.ai/home`

| Metric | Value |
|--------|-------|
| Performance score | **78** |
| LCP | 2.8 s |
| FCP | 2.6 s |
| CLS | 0.044 |
| TTFB (server-response-time) | 2,620 ms |

Artifact: `cwv-baseline-exur.json`

## Chat — `https://chat.exur.ai/`

| Metric | Value |
|--------|-------|
| Performance score | **57** |
| SEO score | **100** |
| LCP | 9.1 s |
| FCP | 5.1 s |
| CLS | 0.03 |
| TTFB (server-response-time) | 3,260 ms |

Artifact: `cwv-baseline-chat.json`

Chat LCP is dominated by TTFB / JS boot on cold Worker, not message-list DOM cost.

## SEO smoke (SEO-001)

| URL | Status |
|-----|--------|
| `https://exur.ai/robots.txt` | 200 |
| `https://exur.ai/sitemap.xml` | 200 |
| Chat SEO (Lighthouse) | 100 |

## PERF-002 — Chat list virtualization

**Deferred.** Cold-load CWV does not show long-thread `messages.map` cost. Revisit when field INP degrades with long histories.

## PERF-003 — Bundle analyzer

`pnpm analyze` — see `package.json`.
