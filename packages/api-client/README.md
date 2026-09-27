# `@exur/api-client`

Thin shared chat API contract for the **web app** and **browser extension**.

## What lives here

- Configurable `baseUrl` (`""` / relative for web proxy, `https://api.exur.ai` for extension)
- Injectable `TokenStore` (sessionStorage vs `chrome.storage`)
- Chat path helpers, SSE parse (`FRONTEND_SSE.md` contract), stream helper

## What does not live here

- React UI, next-intl, Next.js routes, cookie refresh implementation details

Web continues to use `lib/api/*` day-to-day. Keep SSE / request shapes aligned with this package when either side changes the contract.
