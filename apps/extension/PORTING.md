# Porting web chat UI → extension

When chat UI changes on the web and you want the same quality in the extension, **copy intentionally**. Do not import web modules into the extension.

## Source → destination map

| Web (source of truth for look/feel) | Extension |
|-------------------------------------|-----------|
| `components/app-shell/chat-*` | `apps/extension/src/components/chat/` |
| `components/app-shell/ai-message-renderer.tsx` | `apps/extension/src/components/chat/ai-message-renderer.tsx` |
| `components/ui/*` (primitives used by chat) | `apps/extension/src/components/ui/` |
| `app/styles/chat-gemini.css` | `apps/extension/src/styles/chat-gemini.css` |
| Theme tokens in `app/globals.css` | `apps/extension/src/styles/globals.css` |
| `lib/api/*` chat/SSE contracts | Prefer updating `packages/api-client` first |
| `messages/*.json` chat keys | `apps/extension/src/adapters/i18n.tsx` (or copied JSON later) |

## Port checklist

1. List changed files under `components/app-shell/chat-*` (+ styles).
2. Copy or merge into the matching extension path.
3. Replace:
   - `next-intl` → `useExtensionT` / `ExtensionI18nProvider`
   - `@/i18n/navigation`, `next/navigation`, `useSearchParams` → local state / callbacks
   - `next/dynamic` → normal imports
   - Web-only auth (`lib/api/auth` cookie refresh) → `adapters/auth.ts`
4. Keep API calls on `@exur/api-client` with `baseUrl: https://api.exur.ai`.
5. Smoke-test side panel: send message, thinking/tools, history, new chat, sign-in button.
6. Do **not** change web files just to make the extension compile.

## Never port (unless product asks later)

- Desk / dashboard / news panel
- Marketing landing
- Website toolbar
- Google One Tap (use `chrome.identity` OAuth — see `AUTH.md`)
- Full billing checkout (link out to `https://chat.exur.ai`)

## Ownership reminder

See `BOUNDARIES.md`. Web PRs must not depend on `apps/extension`.
