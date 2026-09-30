# Porting web chat UI → extension

When chat UI changes on the web and you want the same quality in the extension, **copy intentionally**. Do not import web modules into the extension.

## Source → destination map

| Web (source of truth for look/feel) | Extension |
|-------------------------------------|-----------|
| `components/app-shell/chat-*` | `apps/extension/src/components/app-shell/chat-*` |
| `components/app-shell/ai-message-renderer.tsx` | `apps/extension/src/components/app-shell/ai-message-renderer.tsx` |
| `components/app-shell/chat-news-panel.tsx` | `apps/extension/src/components/app-shell/chat-news-panel.tsx` |
| `components/dashboard/news-bulletin.tsx` (+ intel helpers used by news) | `apps/extension/src/components/dashboard/` (news only) |
| `components/ui/*` (primitives used by chat) | `apps/extension/src/components/ui/` |
| `app/styles/chat-gemini.css` | `apps/extension/src/styles/chat-gemini.css` |
| Theme tokens in `app/globals.css` | `apps/extension/src/styles/globals.css` |
| `lib/api/*` chat/SSE / news contracts | Prefer updating `packages/api-client` first |
| `messages/*.json` chat keys | `apps/extension/src/messages/` (+ shims/adapters) |

## Port checklist

1. List changed files under `components/app-shell/chat-*` (+ news panel / bulletin / styles).
2. Copy or merge into the matching extension path.
3. Replace:
   - Web-only auth (`lib/api/auth` cookie refresh) → `adapters/auth.ts`
   - In-app `/upgrade` / `/billing` → absolute `https://chat.exur.ai/...` (new tab)
   - Keep `next/dynamic` via shim when needed
4. Keep API calls on `@exur/api-client` with `baseUrl: https://api.exur.ai`.
5. Smoke-test side panel: send message, thinking/tools, history, **news sheet**, new chat, sign-in.
6. Do **not** change web files just to make the extension compile.

## Never port (unless product asks later)

- Full desk / dashboard workspace (beyond chat news)
- Marketing landing / cookie consent / PWA install
- Website toolbar
- Google One Tap (use `chrome.identity` OAuth — see `AUTH.md`)
- Full billing checkout (link out to `https://chat.exur.ai`)

## Ownership reminder

See `BOUNDARIES.md`. Web PRs must not depend on `apps/extension`.
