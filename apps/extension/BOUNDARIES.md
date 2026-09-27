# Extension boundaries (independence + intentional alignment)

## Ownership

| Area | Owner | Path |
|------|--------|------|
| Web chat UI | Web only | `components/app-shell/` |
| Web App Router / proxy / cookie auth | Web only | `app/`, `proxy.ts`, `lib/api/auth.ts` (cookie refresh) |
| Extension app | Extension only | `apps/extension/**` |
| Shared API contract | Thin shared | `packages/api-client` |

## Rules

1. **No cross-imports of UI.** The extension must not import `@/components/app-shell` or any Next.js route/module from the web app.
2. **Web PRs must not depend on the extension.** Changing chat UI in the web app must not require `apps/extension` to build.
3. **Extension PRs must not require refactoring web chat** unless fixing a true shared API contract bug in `packages/api-client`.
4. **UI alignment is intentional copy/port**, not a forced single package. When web chat UI changes and you want the same in the extension, follow [`PORTING.md`](./PORTING.md).
5. **API alignment is shared.** Chat SSE shapes, path helpers, and fetch/token abstractions live in `packages/api-client` so web and extension do not invent divergent contracts.

## What is ported vs never ported (MVP)

**Port (chat parity):** composer, messages, thinking/SSE, history, signal cards, chat styles, account extras needed for chat.

**Do not port:** desk/dashboard, news panel, marketing/landing, website toolbar, Google One Tap (use extension OAuth instead), billing checkout pages (link out to web).
