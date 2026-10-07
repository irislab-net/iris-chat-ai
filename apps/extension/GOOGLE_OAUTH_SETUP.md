# Extension Google login (API PKCE — no chrome.identity)

Store builds do **not** use `chrome.identity` or `https://*.chromiumapp.org/` redirects.  
Sign-in is a normal browser tab to `api.exur.ai`, then back to the extension callback page.

## Flow

1. Extension opens `login.html` → user accepts Terms/Privacy.
2. Navigate to  
   `https://api.exur.ai/v1/auth/google/login?app=chromimum_extension&destination=chrome-extension://<EXT_ID>/callback.html&…`
3. Backend runs the same Google OAuth + PKCE path as the web app, sets HttpOnly `refresh_token`, redirects to `callback.html`.
4. Extension reads the cookie with `chrome.cookies` and mints Bearer tokens into `chrome.storage.local`.

`callback.html` **must** be listed under `web_accessible_resources` in the manifest. Otherwise Chrome blocks the web → extension redirect with `ERR_FAILED` / unsafe redirect (this is what breaks production sign-in).

## What to configure

### Backend / API

- Honor `app=chromimum_extension` and the `destination` query (must allow `chrome-extension://…/callback.html`).
- CORS for `chrome-extension://<LOCAL_OR_STORE_ID>` on refresh / me / chat (see [`STORE_CHECKLIST.md`](./STORE_CHECKLIST.md)).

### Google Cloud (web OAuth client used by `api.exur.ai`)

Configure the **API / website** redirect URIs that `api.exur.ai` already uses for web Google login.  
You do **not** need `chromiumapp.org` URIs for the store extension build.

## Local unpacked ID

`manifest.key` pins the local unpacked ID to `adnehcimnmfchnaoegcomjpknpgfgnpj` so CORS can allow:

```
chrome-extension://adnehcimnmfchnaoegcomjpknpgfgnpj
```

Store packs strip `key`. Production CWS ID is:

```
chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm
```

Add that origin to `api.exur.ai` CORS, and make sure OAuth `destination` redirects to that ID’s `callback.html` (never the local unpacked ID).

## Rebuild

```bash
pnpm extension:build
# or for store zip:
pnpm extension:pack
```
