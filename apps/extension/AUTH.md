# Extension auth

## Error 400: `redirect_uri_mismatch`

Google rejected the redirect URI. Fix:

1. Rebuild/reload so the stable manifest `key` is applied (fixed extension ID).
2. In Google Cloud → OAuth **Web** client → **Authorized redirect URIs**, add **exactly**:

```
https://adnehcimnmfchnaoegcomjpknpgfgnpj.chromiumapp.org/
```

3. Remove old unpacked extension, load `apps/extension/dist` again, confirm ID
   is `adnehcimnmfchnaoegcomjpknpgfgnpj`.

Full steps: [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md).

## How sign-in works

1. Side panel **Sign in** opens `login.html` in a normal Chrome tab — Exur consent
   wizard (Terms + Privacy switches) plus the cookie/privacy banner.
2. After consent, `chrome.identity.launchWebAuthFlow` → Google OIDC `id_token`
3. `POST https://api.exur.ai/v1/auth/google/one-tap` (same as web One Tap)
4. Tokens land in `chrome.storage`; popup notifies the side panel and closes

## Env

`apps/extension/.env`:

```bash
VITE_GOOGLE_CLIENT_ID=<same as NEXT_PUBLIC_GOOGLE_CLIENT_ID>
```

## CORS

`api.exur.ai` must allow `chrome-extension://adnehcimnmfchnaoegcomjpknpgfgnpj`
on `/v1/auth/google/one-tap`, `/v1/auth/refresh`, and `/v1/me`.

## Token refresh

MV3 has no refresh cookie. Access + refresh tokens live in `chrome.storage.local`.
Chat API 401s and post-Plus upgrade call `refreshAccessToken` →
`POST /v1/auth/refresh` with the stored refresh token in the body. On hard expiry,
storage is cleared and the side panel drops to signed-out.
