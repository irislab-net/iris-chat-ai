# Chrome Web Store — production checklist

Prior rejections:
- **Red Potassium / login:** reviewers hit login error and could not chat.
- **Purple Potassium (0.0.3):** unused `identity` permission — never request unused APIs.

Use this before every upload of `exur-chat-extension.zip`.

## Code / pack

```bash
# from repo root
pnpm extension:pack
# → apps/extension/exur-chat-extension.zip
```

- [ ] Zip built with `pnpm extension:pack` (not raw `dist/` — pack strips `manifest.key`)
- [ ] Pack confirms `app=chromimum_extension` is in the built JS
- [ ] Pack confirms `callback.html` is in `web_accessible_resources` (OAuth redirect)
- [ ] Pack fails if `identity` / `chrome.identity` / unexpected host_permissions appear
- [ ] Version bumped in `manifest.config.ts` + `package.json` (currently **0.0.5**)
- [ ] Smoke on the **packed** build (load zip contents or keyless staging): sign-in → chat → news → Upgrade opens `https://chat.exur.ai/upgrade`

## Manifest readiness (shipped)

| Item | Status |
|---|---|
| MV3, single purpose (side-panel chat) | ✅ |
| `name` / `description` ≤ 132 chars | ✅ |
| Icons 16 / 32 / 48 / 128 (+ action.default_icon) | ✅ |
| `homepage_url` → chat.exur.ai | ✅ |
| No remote JS / no `eval` (CSP `script-src 'self'`) | ✅ |
| Host permissions only `api.exur.ai` + `chat.exur.ai` (no logo CDNs) | ✅ |
| Permissions: `sidePanel`, `storage`, `cookies` only — **no `identity`** | ✅ |

## Google Cloud Console (manual)

Sign-in is **API PKCE only** (`api.exur.ai` → Google → `callback.html`).  
Do **not** rely on `chromiumapp.org` / `chrome.identity` redirects for the store build.

1. OAuth consent screen → **In production** (or add every reviewer Google account as a test user).
2. Authorized JavaScript origins for the web client may still list `https://chat.exur.ai` (website); extension uses redirect / cookies on `api.exur.ai`.
3. Backend must allow `destination=chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm/callback.html` (and honor that URL after Google OAuth — do **not** hardcode the local unpacked ID).
## `api.exur.ai` CORS (manual)

Allow origin `chrome-extension://icbhmedhckhkbmjkpigfdkejldlohhcm` (and local unpacked `adnehcimnmfchnaoegcomjpknpgfgnpj`) on:

- `POST /v1/auth/refresh`
- `GET /v1/me`
- `POST /v1/chat/guest/session`
- `POST /v1/chat/*` (message / stream)
- Google login start is a full navigation to `api.exur.ai` (not CORS)

Also ensure `app=chromimum_extension` honors `destination=chrome-extension://…/callback.html` after setting the `refresh_token` cookie.

## Chrome Web Store listing fields

### Required assets (you already have)

| Upload | File | Size |
|---|---|---|
| Store icon | `store-assets/store-icon-128.png` | 128×128 opaque |
| Screenshots (prefer 1–4 live product) | `screenshot-1-landing` … `screenshot-4-news` | 1280×800 |
| Small promo | `small-promo-440x280.png` | 440×280 |
| Marquee (optional, for featuring) | `marquee-promo-1400x560.png` | 1400×560 |

Avoid older mock set (`*-side-panel|sign-in|ask-anywhere`) unless they still match the UI.

### Listing copy (paste)

**Short description** (manifest / listing summary):

> AI co-pilot in your Chrome side panel — chat, market news, and trade context.

**Detailed description:**

```
Exur Chat is an AI co-pilot that opens in Chrome’s side panel.

• Sign in with Google (Terms + Privacy consent first)
• Chat about markets and setups with streaming replies
• Browse market news from the side panel
• Manage chat history in the panel
• Upgrade / billing continue on https://chat.exur.ai

Exur provides analytics for information only — not financial advice.
You must be 18+ and not located in a comprehensively sanctioned jurisdiction.
```

**Category:** Productivity (or Finance — pick one and stay consistent)  
**Language:** English (+ other locales if you upload locale screenshots)  
**Support URL:** `https://exur.ai` or `mailto:hello@exur.ai`  
**Privacy policy URL (required):** `https://exur.ai/privacy`  
  (must be a public HTTPS page; same policy users accept at login)

### Privacy practices tab (paste justifications)

**Single purpose:**  
Side-panel AI chat co-pilot for market questions, news, and conversation history.

**Remote code:** No — all JS is bundled in the extension; API calls return data/JSON/SSE only.

**Permissions:**

| Permission | Justification |
|---|---|
| `sidePanel` | Primary UI — open Exur Chat beside the current tab |
| `storage` | Persist access/refresh tokens and UI prefs in `chrome.storage.local` (MV3 has no API cookies in the side panel) |
| `cookies` | After Google OAuth, `api.exur.ai` sets an HttpOnly `refresh_token` cookie; the extension callback page reads it once to mint tokens into `chrome.storage`, then uses Bearer auth |

**Not requested (and must stay out):** `identity` (unused — sign-in is API PKCE), `tabs`/`activeTab` (we only `chrome.tabs.create`/`query` which do not need the `tabs` permission), logo CDN host permissions (images load via CSP `img-src https:`).

**Host permissions:**

| Host | Justification |
|---|---|
| `https://api.exur.ai/*` | Auth, chat SSE, news/credits APIs + `chrome.cookies.get` for `refresh_token` |
| `https://chat.exur.ai/*` | Cookie fallback URL for the same Domain=.exur.ai `refresh_token` during OAuth callback |

**Data use (disclose):** Personally identifiable information (account email/profile from Google via our API), authentication credentials (tokens in extension storage), user activity (chat messages sent to our API). Certify Limited Use.

### Reviewer notes (paste into CWS)

```
Exur Chat — side panel AI co-pilot.

Sign-in (primary):
1. Install → click toolbar icon → side panel opens.
2. Sign in → accept Terms + Privacy → Continue with Google.
3. Browser tab opens api.exur.ai Google OAuth; after success it returns to
   chrome-extension://<THIS_ID>/callback.html which stores session tokens.
4. Side panel should show the signed-in account.
5. Send a short chat message; open News from the menu.
6. Upgrade opens https://chat.exur.ai (new tab).

Backend must allow CORS for chrome-extension://<THIS_ID> on api.exur.ai
and redirect OAuth destination to callback.html with the refresh cookie set.

Test account: use any Google account allowed by our OAuth consent screen
(Production) or the listed test users.
```

## Common rejection traps (check before submit)

1. **Login broken for reviewers** — OAuth consent not Production / missing test users; CORS missing store ID; `destination` not wired for `chromimum_extension`.
2. **Permission overreach** — do not add `<all_urls>`, broad `*.exur.ai`, or unused APIs.
3. **Remote hosted code** — no CDN scripts; keep CSP `script-src 'self'`.
4. **Listing mismatch** — screenshots must show working side panel (not error banners).
5. **Privacy policy missing / mismatch** — URL must load and match disclosed data use.
6. **Minimum functionality** — empty shell or “sign-in only” with no working chat gets rejected.
7. **Misleading claims** — do not promise guaranteed trading profits; keep “not financial advice”.

## Policy refs

- [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare)
- [Supplying images](https://developer.chrome.com/docs/webstore/images)
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Remote hosted code](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code)
- [Minimum functionality](https://developer.chrome.com/docs/webstore/program-policies/minimum-functionality)
- [Troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting)
