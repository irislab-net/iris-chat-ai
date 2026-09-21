# Exur

Focused Exur app — **News**, **Exur Chat**, and marketing/legal pages.

## Features

- **News** — scored market headlines and intel feed
- **Exur Chat** — docked co-pilot beside the news feed (desktop) or full-screen (mobile)
- **Trade signal cards** — when the model returns a clear setup (`show_trade_signal` / `@signal`)
- **Landing** — `/home` marketing site
- **Billing / upgrade / legal** — Plus plans, terms, privacy, about

Removed: trading desk UI, paper-trading engine, TradingView / Lightweight Charts, open-signal-in-trade tools.

## Development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and configure API endpoints before running.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | HTTPS dev server on port 3000 |
| `pnpm dev:http` | HTTP dev server |
| `pnpm build` | Production build (OpenNext + Cloudflare) |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest unit tests |
