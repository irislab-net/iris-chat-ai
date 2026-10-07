# Exur browser extension

MV3 **side panel** chat app (Vite + `@crxjs/vite-plugin`). Independent from the Next.js web app; shares only `@exur/api-client`.

## Develop

```bash
# from repo root
pnpm install
pnpm extension:dev
```

Load `apps/extension/dist` (or the CRXJS dev path printed by Vite) as an unpacked extension in Chrome → Extensions → Developer mode.

```bash
pnpm extension:build
```

## Store listing graphics

```bash
pnpm --filter @exur/extension store-assets
```

Outputs opaque PNGs in [`store-assets/`](./store-assets/) (icon, screenshots, promo tiles). See that folder’s README for the upload map.

## Publish (Chrome Web Store)

Store rejects `manifest.key`. Pack with:

```bash
pnpm extension:pack
```

Upload `apps/extension/exur-chat-extension.zip` (not the raw `dist/` folder).

**Before reviewers test again**, complete [`STORE_CHECKLIST.md`](./STORE_CHECKLIST.md):

1. Allow CORS origin `chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm` on `api.exur.ai`
2. Honor OAuth `destination=chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm/callback.html` (do not hardcode the local unpacked ID)
3. OAuth consent **In production** (or add reviewer test users)
4. Paste reviewer notes from the checklist into the CWS dashboard

Local unpacked builds keep `key` so the ID stays `adnehcimnmfchnaoegcomjpknpgfgnpj`.
Store ID is `icbhmedhckhkbmjkpigfdkejldlohhcm`.

## Docs

- [`STORE_CHECKLIST.md`](./STORE_CHECKLIST.md) — production / resubmit checklist
- [`BOUNDARIES.md`](./BOUNDARIES.md) — independence rules
- [`PORTING.md`](./PORTING.md) — how to copy UI from web when it changes
- [`AUTH.md`](./AUTH.md) — extension OAuth / CORS requirements (backend)

## Layout

```
src/
  sidepanel/main.tsx          # mounts real ChatAside (same as web)
  components/app-shell/       # ported from web components/app-shell/chat-*
  components/ui/              # shadcn primitives copy
  adapters/                   # chrome auth / token store
  shims/                      # next-intl, next/navigation, next/dynamic
  i18n/                       # routing + Link stubs
  lib/                        # ported chat/api libs (API base → api.exur.ai)
  styles/                     # globals + chat-gemini
  background.ts
```

The side panel renders the **same `ChatAside`** tree as the web chat column (composer, history, thinking, signals, **news sheet**, account menu). Marketing landing, desk workspace, cookie banner, and PWA install are out of scope — billing/upgrade open `https://chat.exur.ai` in a new tab.
