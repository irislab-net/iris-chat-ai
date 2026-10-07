# Extension auth

## How sign-in works

1. Side panel **Sign in** opens `login.html` in a normal Chrome tab — Exur consent wizard (Terms + Privacy).
2. After consent, full navigation to  
   `GET https://api.exur.ai/v1/auth/google/login?app=chromimum_extension&destination=<chrome-extension://…/callback.html>&terms&privacy_notice`  
   (same PKCE/cookie Google flow as web).
3. Backend sets the HttpOnly `refresh_token` cookie (`Domain=.exur.ai`, `Path=/v1/auth`) and redirects to `callback.html` (usually **without** tokens in the URL).
4. `callback.html` reads that cookie via `chrome.cookies`, calls `POST /v1/auth/refresh` with the refresh token in the body, stores access + refresh in `chrome.storage.local`, sends `exur:auth-success`, shows success, and closes the tab.
5. Side panel refreshes via `GET https://api.exur.ai/v1/me` and chat on `https://api.exur.ai/v1/chat/*`.

`callback.html` is declared in `web_accessible_resources` so the HTTP 303 from `api.exur.ai` is allowed. Missing that entry → Chrome `ERR_FAILED` on the callback URL in production.

If the API ever puts tokens in the hash/query instead, the callback still accepts them as a fallback.

Failures show a visible banner in the side panel (not screen-reader-only).

**Backend contract:** for `app=chromimum_extension`, honor `destination` (the extension callback URL) after setting the same auth cookies as web.

## Permissions (CWS)

Do **not** request `identity`. Sign-in never calls `chrome.identity` / `launchWebAuthFlow`.  
Unused permissions → **Purple Potassium** rejection.

Required: `sidePanel`, `storage`, `cookies`, plus host access to `api.exur.ai` and `chat.exur.ai` for API + cookie handoff.

## Env

Primary store sign-in is API PKCE and does **not** need a Google client ID baked into the extension JS.  
`pnpm extension:pack` aborts if `app=chromimum_extension` is missing from the build, or if `identity` / `chrome.identity` appears.

## CORS

`api.exur.ai` must allow **both**:

- `chrome-extension://adnehcimnmfchnaoegcomjpknpgfgnpj` (local unpacked with `manifest.key`)
- `chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm` (Chrome Web Store)

on `/v1/auth/refresh`, `/v1/me`, and `/v1/chat/*`.  
(Google login itself is a top-level navigation to `api.exur.ai`, not a CORS call.)

**Critical:** for `app=chromimum_extension`, the API must 303 to the `destination` query as-is (store ID), not a hardcoded local extension ID. Redirecting to `adnehcim…` while the installed store build is `icbhmed…` → Chrome `ERR_FAILED`.

## Token refresh

MV3 has no refresh cookie in the side panel. Access + refresh tokens live in `chrome.storage.local`.
Chat API 401s and post-Plus upgrade call `refreshAccessToken` →
`POST /v1/auth/refresh` with the stored refresh token in the body. On hard expiry,
storage is cleared and the side panel drops to signed-out.
