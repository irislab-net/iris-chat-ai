# IRIS Chat AI

Focused fork of IRIS Lab — **News** and **IRIS Chat** only.

## Features

- **News** — scored market headlines and intel feed
- **IRIS Chat** — docked co-pilot beside the news feed (desktop) or full-screen tab (mobile)

Removed from the full IRIS Lab app: trading desk, paper trading, analysis tab, and related UI.

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
