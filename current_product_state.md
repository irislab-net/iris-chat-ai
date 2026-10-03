# Exur — Current Product State

> Code-derived inventory of product architecture, user flows, and UI capabilities.  
> Scope: this Next.js app (`iris-chat-ai`) plus its proxied calls to `api.exur.ai`.  
> Generated from actual source; marketing claims that lack matching product code are called out explicitly.

**Stack context:** Single Next.js 16 App Router app (`app/[locale]/`). Chat shell: `components/app-shell/chat-aside.tsx`. Auth and chat quota enforcement ultimately live on the Iris API (`api.exur.ai`); this repo is the client + V1 proxy (`app/v1/` → `lib/api/v1-route.ts`).

---

## 1. Onboarding & Conversion Flow

### 1.1 Guest → authenticated (Google Sign-in)

**Auth stack:** Custom Google OAuth against `https://api.exur.ai` — not Clerk, NextAuth, Auth.js, or Firebase.

**End-to-end journey:**

```
Guest opens desk / chat
  → ensureGuestSession()  POST /v1/chat/guest/session
  → localStorage: iris_guest_token, iris_guest_user_id
  → chat requests use Bearer guest_token

User taps Sign in / Continue with Google
  → AuthProvider.login({ source: "chat" | … })
  → LoginConsentDialog if legal terms not yet accepted
  → startLoginWithGoogle() → GET api.exur.ai/v1/auth/google/login?app=chat
  → Google OAuth → /auth/success
  → establishSession() (refresh cookie → access JWT)
  → mergeGuestAccount()  POST /v1/chat/account/merge
  → adoptGuestConversations() (local thread rebinding)
  → setChatRegisteredUserId(user.id) → isGuestChatSession() === false
```

| Step | File / symbol |
|------|----------------|
| Auth context & `login()` | `components/auth/auth-provider.tsx` |
| Legal consent modal | `components/auth/login-consent-dialog.tsx` |
| Google One Tap (signed-out, chat host) | `components/auth/google-one-tap.tsx` |
| OAuth redirect helper | `lib/api/auth.ts` → `startLoginWithGoogle` |
| OAuth URL builder | `lib/api/config.ts` → `loginWithGoogleUrl` |
| Post-OAuth callback page | `app/auth/success/page.tsx` |
| Guest session create/store | `lib/guest-chat.ts` → `ensureGuestSession`, `storeGuestSession` |
| Guest → registered merge | `lib/guest-chat.ts` → `mergeGuestAccount` |
| Guest vs registered flag | `lib/chat-auth-session.ts` → `isGuestChatSession` |
| Request auth header | `lib/api/chat-client.ts` |

**Sign-in entry points (UI):**

- Account chrome: `chat-account-menu.tsx`, `chat-account-footer.tsx`, `chat-account-sheet.tsx`
- Inline thread CTA after guest trial exhaustion (`message.action === "connect"`) in `chat-aside.tsx`
- Landing nav: `components/landing/modern/landing-nav.tsx`
- Google One Tap when signed out on the chat host

**Guards:** `proxy.ts` handles host routing / i18n only — **no middleware auth gate**. The desk and chat are usable as a guest; authenticated features check JWT presence at call time.

**OAuth UX detail:** Chat / PWA uses a full-page `window.location.assign` to Google; marketing surfaces may open a popup (`lib/api/auth.ts`).

---

### 1.2 “3 free messages” — where enforced

Marketing and UI copy say **3 messages per week**. The **numeric cap is not hardcoded for enforcement in the frontend**; it comes from the API as `TrialInfo`.

**Type** (`lib/api/types.ts`):

```ts
TrialInfo = {
  is_guest?: boolean
  messages_limit: number
  messages_used: number
  messages_remaining: number
  weekly_reset_at: string
}
```

**Where “3” appears in this repo (copy / fixtures only):**

| Kind | Location |
|------|----------|
| Marketing constant | `lib/landing-modern-data.ts` → `GUEST_TRIAL_STAT = "3"` |
| Landing section | `components/landing/modern/guest-trial-section.tsx` |
| i18n copy | `messages/en.json` (e.g. “Guest · 3 free messages this week”) |
| Test fixture | `lib/api/chat-route.test.ts` (`messages_limit: 3`) |

**Enforcement layers (actual behavior):**

1. **Session source of truth** — `POST /guest/session` (`lib/guest-chat.ts` → `ensureGuestSession`) returns `trial` with remaining count; stored guest token reused across reloads.
2. **Frontend pre-check** — `chat-aside.tsx`:
   - `guestTrialExhausted = !isAuthenticated && (guestTrial?.messages_remaining ?? 1) <= 0`
   - On send, if exhausted → `appendGuestLoginRequiredTurn()` — **no API call**; local user bubble + assistant turn with `action: "connect"`.
3. **API hard stop** — `POST /message` or `/message/stream` returns `code: "login_required"` (JSON 403, or SSE `event:error`). Mapped in `lib/api/chat-errors.ts` (`CHAT_LOGIN_REQUIRED_CODE`) and handled in `lib/co-pilot-recovery.ts` / `chat-aside.tsx` via `replaceAssistantWithGuestLoginPrompt()`.
4. **Weekly reset** — driven by server `weekly_reset_at`; no client-side counter DB.

**Label helper:** `formatGuestTrialLabel()` in `lib/guest-chat.ts` (“N free messages left this week” / “Sign in to continue”).

**When exhausted — UX:**

- **No redirect.** Composer stays visible; send is blocked.
- Inline assistant message with **Continue with Google** button (`login({ source: "chat" })`).
- Contrast: signed-in credit exhaustion opens `CreditsExhaustedDialog` (upgrade), not the guest sign-in CTA.

---

### 1.3 Upgrade path to Plus (USDT / USDC)

**Product tiers in code** (`lib/api/schemas.ts` / `lib/api/types.ts`): `free` | `pro` | `ultimate`. UI displays `pro` as **Plus** (`displayPlanName` / billing catalog). `isPro()` treats `pro` and `ultimate` (or active trial) as paid.

#### UI surfaces

| Surface | Path / component |
|---------|------------------|
| Upgrade page | `app/[locale]/upgrade/page.tsx` → `UpgradeView` |
| Billing page | `app/[locale]/billing/page.tsx` → `BillingView` |
| Landing pricing | `components/landing/modern/pricing-section.tsx` |
| Crypto checkout sheet | `components/billing/crypto-payment-sheet.tsx` |
| Token / network picker | `payment-method-picker.tsx`, `lib/billing/payment-options.ts` |
| Deposit QR + address | `deposit-address-card.tsx` |
| Plan cards | `upgrade-plan-card.tsx` |
| Credit usage chrome | `credit-usage-status.tsx` |

**Crypto options** (`lib/billing/payment-options.ts`): network **Ethereum** only; tokens **USDT** and **USDC**. Default checkout currency is USDT.

**Checkout flow (client):**

1. User opens `/upgrade` or conversion modal CTA → `CryptoPaymentSheet`.
2. `resolvePlusCryptoCheckout` / `createPaymentInvoice` → `POST /v1/payments/invoices` with `plan_id` `pro_monthly` (annual exists in IDs but UI forces monthly — `upgrade-view.tsx`).
3. Sheet shows amount + `pay_address` (QR).
4. Client polls invoice until `paid` / expired / failed.
5. On paid → `markPlanUpgradePendingRefresh()` + `refreshAfterUpgrade()` → desk with refreshed `/v1/me` (`tier: pro`).

**Backend in this repo:** No on-chain settlement code. Settlement is on Iris API via V1 proxy. Invoice helpers: `lib/billing/invoices.ts`, types in `lib/billing/invoice-types.ts`.

**Stripe:** `lib/billing/checkout.ts` + `app/api/billing/checkout/route.ts` exist, but **upgrade UI does not call them** — primary CTA is “Pay with crypto”.

**Ultimate:** Contact / sales path (X / email), not crypto checkout.

#### Conversion triggers & modals

| Trigger | Audience | Behavior |
|---------|----------|----------|
| Guest trial exhausted | Guest | Inline **Continue with Google** — not upgrade |
| Signed-in credit exhaustion (`daily_limit_reached`, `weekly_limit_reached`, `insufficient_credit`) | Free / Plus | Opens `CreditsExhaustedDialog` (`chat-aside.tsx` → `setCreditsExhaustedOpen(true)`) |
| `CreditsExhaustedDialog` | Free | Primary → `/upgrade`; shows USDT/USDC logos |
| `CreditsExhaustedDialog` | Plus | Primary → `/billing` (“limit resets”) |
| Toolbar / account / history Upgrade buttons | Authenticated non-Plus | Link to `/upgrade` |
| Landing pricing Plus CTA | Anyone | Desk `/upgrade` |
| Pending invoice banner | Returning payer | Resume crypto sheet on `UpgradeView` |

**Limits:** Guest = weekly message trial from API. Signed-in Free/Plus = `ChatCreditBalance` (`daily_limit`, `weekly_limit`, …) from `/v1/chat/credits`. This repo does **not** hardcode Free vs Plus numeric caps — only qualitative upgrade copy.

---

## 2. Setup Cards & UI Components (The Desk)

### 2.1 How trade setup cards are rendered

**Structured React components — not markdown text blocks.**

| Role | File |
|------|------|
| Card UI | `components/app-shell/chat-signal-card.tsx` → `ChatSignalCard` |
| Mount in thread | `components/app-shell/chat-aside.tsx` (renders when `message.paperTicket` is set) |
| Tool → ticket parse | `lib/chat/client-tools.ts` → `parseShowTradeSignalArgs` / `executeChatClientActions` |
| Ticket type | `lib/chat/signal-ticket.ts` → `PaperTradeTicket` |
| R/R helper | `lib/chat/signal-setup.ts` → `signalRewardRiskRatio` |
| Price formatting | `lib/chat/trade-signal.ts` → `formatTradePrice` |
| Shared card chrome | `components/app-shell/chat-mobile-gemini-styles.ts` |

**Pipeline:** Backend/assistant emits a **client tool** `show_trade_signal` → `executeChatClientActions` builds a `PaperTradeTicket` → `ChatSignalCard` renders an `<article>`. Surrounding assistant prose may still use the markdown renderer; the setup itself is component-driven.

**`ChatSignalCard` structure:**

| Region | Content |
|--------|---------|
| Header | Symbol + LONG/SHORT chip (emerald/rose) + “Trade signal” label |
| Setup line | Optional `ticket.setup` |
| Price band (3 tiles) | Stop Loss · Entry (emphasized) · Take Profit — with optional per-level reasons |
| Meta grid | Leverage (`Nx`), size (if > 0), R/R as `1 : {ratio}`, time horizon |
| Thesis inset | Short thesis + disclaimer |

Required tool fields: `symbol`, `direction`/`side`, `entry`, `stopLoss`, `takeProfit`. Leverage/size of `0` are treated as “not provided” and hidden.

> Note: `lib/iris-paper-trade/` referenced in older notes is **gone**. Live path is `lib/chat/*` + chat tool execution.

### 2.2 Interactive elements inside chat

| Element | Component | Notes |
|---------|-----------|--------|
| Thumbs up / down | `chat-message-actions.tsx` | Message-level; analytics + optional API |
| Copy | same | Clipboard + `trackChatMessageCopied` |
| Reply | same | Quotes prior turn into composer |
| Thinking accordion | `chat-thinking-trace.tsx` + `components/ui/accordion.tsx` | Collapsible reasoning / tools inside assistant turn |
| Tooltips | Mostly sidebar chrome (`chat-history-sidebar.tsx`) | Not on signal cards |
| FAQ accordion | Landing only (`faq-section.tsx`) | Not desk chat |

**`ChatSignalCard` and `ChatNoTradeCard` are display-only** — no buttons, expands, or tooltips on the cards themselves.

### 2.3 “Wait” (no-trade) vs setup card

| | Setup | Wait / no-trade |
|--|--------|-----------------|
| Component | `ChatSignalCard` | `ChatNoTradeCard` (`chat-no-trade-card.tsx`) |
| Trigger | Client tool `show_trade_signal` → `paperTicket` | Client tool `no_trade` → `noTradeReason` |
| Badge | LONG / SHORT | Amber **Wait** (`workspace.noTradeBadge`) |
| Title | Symbol + side | “No trade” / subtitle “No clear setup right now” |
| Color wash | Green (long) or rose (short) | Amber + soft blue (`noTradeWashClass`) |
| Body | Entry / SL / TP / meta / thesis | “Why wait” inset with reason text only |

Shared frosted shell class (`chatSignalCardClass`); color language and content diverge so Wait is visually distinct as a pause outcome, not a muted setup.

---

## 3. User Engagement & Feedback Mechanics

### 3.1 After a setup card is generated

**No card-specific post-setup tracking** in this codebase:

- No `onClick`, save, watchlist, or bookmark on `ChatSignalCard` / `ChatNoTradeCard`
- No analytics events for signal-card clicks / watchlist / save in `lib/analytics.ts`
- Privacy copy may mention watchlists; **no product UI** implements them

**What *does* exist (message-level, not card-level):**

| Mechanism | Where | Behavior |
|-----------|-------|----------|
| Thumbs up/down | `ChatMessageActions` | Local feedback state + `trackChatMessageFeedback` |
| Server feedback | `lib/api/chat-feedback.ts` → `POST /feedback` | `submitChatMessageFeedback({ sessionId, messageId, vote })` from `chat-aside.tsx`; soft-fails on 404/501/405 |
| Copy | same actions | `trackChatMessageCopied` |
| Send / open / close | `lib/analytics.ts` | `chat_message_sent`, `chat_open`, `chat_close`, `trackChatMessageBlockedGuest` |

Closest related product surface: historical trade signals list types exist (`TradeSignalItem` in `lib/api/types.ts` with `outcome: "signal" | "no_trade"`), but that is API/list data — not in-card engagement UI.

### 3.2 “Financial Memory” — what the code actually does

**Verdict: Financial Memory (persistent risk tolerance / trading timeframe / persona saved on Google Sign-in and injected into system prompts) is not implemented in this repo.**

Marketing / legal language (“Financial Brain”, “co-pilot that remembers you”, privacy mentions of financial preferences) exists in SEO/landing/privacy copy. Matching product code does **not**.

#### What *is* injected into chat requests

Per-request `client_context` built by `buildChatClientContext` (`lib/chat/client-tools.ts`), wired via `hooks/use-chat-client-context.ts` → `chat-aside.tsx` → `lib/api/co-pilot.ts`:

| Field | Actually set today? |
|-------|---------------------|
| `active_page` | Yes — `"chat"` |
| `active_symbol` | Yes — always `""` |
| `role` | Yes — from user / pro |
| `locale` | Yes — UI locale |
| `timezone` | Yes — browser UTC offset (e.g. `+03:30`) |
| `available_ui_actions` | Yes — `show_trade_signal` (+ `admin_user_lookup` for admin) |
| `timeframe` | Typed on `ChatClientContext` but **never set** by the builder |
| Risk tolerance / persona / custom instructions | **Not present** |

System prompts live on the backend (`api.exur.ai`); this app does not construct them.

#### What Google Sign-in actually persists (user profile)

`userSchema` in `lib/api/schemas.ts` / `/v1/me`:

- Identity: `id`, email, profile image, optional X fields, wallet
- Monetization: `tier`, `trial_*`, `pro_expires_at`, `role`, `referred_by_id`, `last_login_at`
- **No** risk_tolerance, preferred_timeframe, language preference on the user object (UI language is a separate cookie)

#### Account preferences UI (`chat-account-preferences.tsx`)

Only: **theme** (light/dark/system), **UI language** (locale cookie via `persistLocaleChoice`), **cookie settings**. No financial prefs form.

#### Other persistence (not “Financial Memory”)

| Data | Where |
|------|--------|
| UI locale | Cookie `NEXT_LOCALE` (`lib/i18n/locale.ts`) |
| Theme | Client theme store (`@wrksz/themes`) |
| Cookie consent | `lib/consent.ts` |
| Chat threads | Local `lib/chat-storage.ts` + server sessions `lib/api/chat-sessions.ts` |
| Legal acceptance before Google | `lib/legal-acceptance.ts` |

There is **no local app database** (no Drizzle/Prisma migrations) for user financial prefs; identity/credits/trials are upstream API state.

---

## 4. Latency & Data Handling

### 4.1 AI chat timeouts (web — authoritative)

Defined in `lib/api/co-pilot.ts`:

| Constant | Value | Role |
|----------|-------|------|
| `CHAT_REQUEST_TIMEOUT_MS` | **180_000** (3 min) | Wall clock for JSON `POST /message` |
| `CHAT_STREAM_IDLE_TIMEOUT_MS` | **120_000** (2 min) | Abort if no SSE bytes; resets on each chunk via idle bump |
| `CHAT_STREAM_HARD_TIMEOUT_MS` | **600_000** (10 min) | Hard ceiling even with steady activity |

Implementation details:

- `AbortController` + `mergeAbortSignals` / idle timeout helpers in `co-pilot.ts`
- User cancel via `abortRef` in `chat-aside.tsx`
- Timeout UX copy / classification: `lib/co-pilot-recovery.ts` (`COPILOT_TIMEOUT_MESSAGE`, `TimeoutError`)
- SSE reader: `lib/api/chat-sse.ts` — keepalive `:` comments ignored as events; any chunk bytes still bump idle timeout
- Thinking UI pacing: `chat-thinking-progress.tsx` — `MIN_THINKING_MS = 2200`, `STATUS_ROTATE_MS = 2000`

**Other clients (not the main desk):**

| Path | Timeouts |
|------|----------|
| `packages/api-client/src/stream.ts` | Fixed stream **180_000** |
| `apps/extension/.../co-pilot.ts` | JSON **90_000**; stream **180_000** (no idle/hard split) |

### 4.2 Live market / news latency handling

| Concern | Location | Behavior |
|---------|----------|----------|
| News refresh cadence | `lib/format.ts` → `NEWS_REFRESH_INTERVAL_MS = 5 * 60 * 1000` | Used by `dashboard.tsx`, `chat-news-panel.tsx` |
| Public news ISR | `lib/api/public-home.ts` | `PUBLIC_NEWS_REVALIDATE_SECONDS = 300` |
| Tab resume | Dashboard / news panel | Refresh if interval elapsed while backgrounded |
| Live mids API | `app/api/market/mids/route.ts` | Hyperliquid mids for BTC/ETH/XAU; `Cache-Control: s-maxage=15, stale-while-revalidate=30` |
| Landing mids poll | `signals-markets-section.tsx` | Poll `/api/market/mids` every **30_000** ms; `AbortController` on unmount |
| Candles fetch | `lib/api/candles.ts` | Optional `AbortSignal`; **no default client timeout** |

There is no separate “market data loading timeout modal”; news uses loading skeletons (`newsLoading`), and chat uses streaming/thinking UI plus the abort/timeout path above when the model stalls.

---

## Architecture snapshot (for orientation)

```
exur.ai (landing)          chat.exur.ai (desk)
        │                           │
        └──────── Next.js 16 ───────┘
                    │
         app/v1/*  proxy  →  api.exur.ai
                    │
    ┌───────────────┼────────────────┐
    │               │                │
 auth/google   chat/guest|message   payments/invoices
    │               │                │
 Google OAuth   TrialInfo / credits  USDT|USDC Ethereum invoices
```

**In product today (code-backed):** guest trial → Google → Free credits → Plus crypto upgrade; impact news + chat; setup **or** wait cards; message thumbs/copy/reply; locale/theme prefs.

**Not in product code (despite some marketing/privacy copy):** Financial Memory profile, risk/timeframe preference storage, watchlists, setup-card click tracking, Stripe-driven upgrade UI, trade execution / paper desk / open-in-trade CTAs.

---

## Key file index

| Domain | Primary files |
|--------|----------------|
| Guest trial | `lib/guest-chat.ts`, `chat-aside.tsx`, `lib/api/types.ts` (`TrialInfo`) |
| Google auth | `auth-provider.tsx`, `lib/api/auth.ts`, `lib/api/config.ts`, `app/auth/success/page.tsx` |
| Plus / crypto | `components/billing/*`, `lib/billing/*`, `app/[locale]/upgrade`, `app/[locale]/billing` |
| Setup / Wait cards | `chat-signal-card.tsx`, `chat-no-trade-card.tsx`, `lib/chat/client-tools.ts` |
| Feedback | `chat-message-actions.tsx`, `lib/api/chat-feedback.ts`, `lib/analytics.ts` |
| Client context | `lib/chat/client-tools.ts` (`buildChatClientContext`), `hooks/use-chat-client-context.ts` |
| Chat latency | `lib/api/co-pilot.ts`, `lib/api/chat-sse.ts`, `lib/co-pilot-recovery.ts` |
| Market data | `app/api/market/mids/route.ts`, `lib/format.ts`, `components/dashboard/dashboard.tsx` |
