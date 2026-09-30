# Extension auth

## Error 400: `redirect_uri_mismatch`

Google rejected the redirect URI. The URI is derived from the **installed extension ID**.

### Local / unpacked (stable `manifest.key`)

```
https://adnehcimnmfchnaoegcomjpknpgfgnpj.chromiumapp.org/
```

### Chrome Web Store build (`pnpm extension:pack` strips `key`)

CWS assigns a **new** ID. Add:

```
https://<STORE_EXTENSION_ID>.chromiumapp.org/
```

Full production steps: [`STORE_CHECKLIST.md`](./STORE_CHECKLIST.md).  
OAuth URI details: [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md).

## How sign-in works

1. Side panel **Sign in** opens `login.html` in a normal Chrome tab — Exur consent wizard (Terms + Privacy).
2. After consent, full navigation to  
   `GET https://api.exur.ai/v1/auth/google/login?app=chromimum_extension&destination=<chrome-extension://…/callback.html>&terms&privacy_notice`  
   (same PKCE/cookie Google flow as web).
3. Backend sets the HttpOnly `refresh_token` cookie (`Domain=.exur.ai`, `Path=/v1/auth`) and redirects to `callback.html` (usually **without** tokens in the URL).
4. `callback.html` reads that cookie via `chrome.cookies`, calls `POST /v1/auth/refresh` with the refresh token in the body, stores access + refresh in `chrome.storage.local`, sends `exur:auth-success`, shows success, and closes the tab.
5. Side panel refreshes via `GET https://api.exur.ai/v1/me` and chat on `https://api.exur.ai/v1/chat/*`.

If the API ever puts tokens in the hash/query instead, the callback still accepts them as a fallback.

Failures show a visible banner in the side panel (not screen-reader-only).

**Backend contract:** for `app=chromimum_extension`, honor `destination` (the extension callback URL) after setting the same auth cookies as web.

## Env

`apps/extension/.env`:

```bash
VITE_GOOGLE_CLIENT_ID=<same as NEXT_PUBLIC_GOOGLE_CLIENT_ID>
```

Keep this for Google Cloud Console / the legacy `chrome.identity` helper.  
Primary store sign-in is API PKCE and does **not** embed the client ID in the JS bundle.  
`pnpm extension:pack` requires the env var and aborts if `app=chromimum_extension` is missing from the build.

## CORS

`api.exur.ai` must allow **both**:

- `chrome-extension://adnehcimnmfchnaoegcomjpknpgfgnpj` (local)
- `chrome-extension://<STORE_EXTENSION_ID>` (store)

on `/v1/auth/refresh`, `/v1/me`, and `/v1/chat/*`.  
(Google login itself is a top-level navigation to `api.exur.ai`, not a CORS call.)

## Token refresh

MV3 has no refresh cookie. Access + refresh tokens live in `chrome.storage.local`.
Chat API 401s and post-Plus upgrade call `refreshAccessToken` →
`POST /v1/auth/refresh` with the stored refresh token in the body. On hard expiry,
storage is cleared and the side panel drops to signed-out.
