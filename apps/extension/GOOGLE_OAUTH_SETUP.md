# Fix Google Error 400: redirect_uri_mismatch

Google rejected the sign-in because the redirect URI from the extension
is **not** listed on your OAuth client.

## Exact URI to add (stable — from extension `key` in manifest)

```
https://adnehcimnmfchnaoegcomjpknpgfgnpj.chromiumapp.org/
```

## Steps

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Open the **OAuth 2.0 Client ID** that matches `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` (Web application)
3. Under **Authorized redirect URIs** → **Add URI** → paste the URI above (keep the trailing `/`)
4. Save
5. Rebuild + reload the extension:
   ```bash
   pnpm extension:build
   ```
   Then in `chrome://extensions` → Remove the old unpacked Exur Chat → **Load unpacked** → `apps/extension/dist`  
   (The `key` in the manifest pins the extension ID so this URI stays valid.)

## Verify

In the extension service worker console (`chrome://extensions` → Service worker):

```js
chrome.identity.getRedirectURL()
```

It must print **exactly** the same string you added in Google Cloud (including trailing slash).

## Notes

- Do **not** use `http://localhost` or `https://chat.exur.ai/...` as the extension redirect.
- JavaScript origins are for GIS/One Tap on the website; this flow needs the **redirect URI**.
- If mismatch persists, wait 1–2 minutes after saving in Google Cloud and try again.
