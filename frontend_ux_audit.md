# Frontend UX Audit — Chat Desk Enhancements

**Role:** Lead Next.js Frontend Architect  
**Scope:** Client-side only (web app under `components/`, `lib/`, `hooks/`). Extension mirrors under `apps/extension/` are noted where relevant.  
**Date:** 2026-10-03  
**Verdict:** All five features are frontend-feasible. Features **1–3 and 5** are fully client-owned. Feature **4** is client-injectable, but **LLM visibility of the profile depends on whether the Iris API already (or will) consume an extended `client_context` / `instructions` field** — the stream request never sends a `messages[]` array today.

---

## Architecture snapshot (relevant surfaces)

| Concern | Primary files |
|--------|----------------|
| Chat shell / send loop | `components/app-shell/chat-aside.tsx` |
| Composer + tools menu | `components/app-shell/chat-composer.tsx` |
| Live assistant turn UI | `components/app-shell/chat-message.tsx` |
| Thinking (orphaned progress) | `components/app-shell/chat-thinking-progress.tsx` |
| Thinking (live SSE trace) | `components/app-shell/chat-thinking-trace.tsx` |
| News panel (inside chat shell) | `components/app-shell/chat-news-panel.tsx` → `components/dashboard/news-bulletin.tsx` |
| Standalone desk news | `components/dashboard/dashboard.tsx` → same `NewsBulletin` |
| Account / avatar sheet | `components/app-shell/chat-account-sheet.tsx`, `chat-account-menu-sections.tsx` |
| Client context builder | `lib/chat/client-tools.ts` → `buildChatClientContext` |
| Context hook | `hooks/use-chat-client-context.ts` |
| Stream / JSON fetch | `lib/api/co-pilot.ts` (`streamCoPilotChatOnce`, `sendCoPilotChat`) |
| Request types | `lib/api/types.ts` (`ChatClientContext`, `CoPilotChatRequest`) |
| Assistant markdown | `components/app-shell/ai-message-renderer.tsx` + `lib/prepare-assistant-markdown.ts` |
| Signal card | `components/app-shell/chat-signal-card.tsx` (`PaperTradeTicket` data only) |
| Tooltips primitive | `components/ui/tooltip.tsx` (Base UI, not Radix — same interaction model) |
| Dialogs | `components/ui/dialog.tsx` |

**Send path (important for #4):**

```
ChatComposer.onSend(text)
  → chat-aside.handleSend(content)
      → optimistic UI message (short / display form)
      → runAssistantRequest({ userMessage, historySnapshot, clientContext })
          → streamCoPilotChat({ message, session_id, effort, client_context, reply_to_id? })
```

The stream POST body is **not** `{ messages: [...] }`. It is:

```json
{
  "session_id": "...",
  "message": "<user turn text>",
  "effort": "...",
  "client_context": { ... },
  "reply_to_id": 123
}
```

`history` is accepted by the TS helper but **not serialized** on the stream path (only reused if SSE falls back to JSON `/message`). Session history is server-owned.

---

## 1. Terminal-like Thinking State

### Current state

- `ChatThinkingProgress` implements rotating status keys (`thinking` → `analyzing` → `weighing` → `synthesizing` → `concluding`), a progress bar, min dwell (`MIN_THINKING_MS = 2200`), and `prefers-reduced-motion` short-circuit.
- **Blocker / surprise:** this component is **orphaned**. Nothing imports `ChatThinkingProgress` (web or extension). i18n under `workspace.thinkingProgress.statuses.*` is unused at runtime.
- Live waiting UX lives in `ChatAssistantTurn` (`chat-message.tsx`):
  - `waiting && !hasThinking` → `TypingDots`
  - `hasThinking` → `ChatThinkingTrace` (accordion of real SSE reasoning/tool steps)
  - While `waiting && hasThinking`, assistant body/content is suppressed until the turn completes

Statuses like “analyzing / weighing” are **cosmetic UI timers**, not stream statuses. Real stream signals are `onReasoning` / `onTool` → `thinkingTrace`.

### Feasibility: **High**

### Recommended approach

**Do not bolt the terminal skeleton into the SSE accordion as the only path.** Split the empty-wait vs. real-trace phases:

1. **Primary inject point:** `ChatAssistantTurn` when `waiting && !hasThinking` (replace `TypingDots`), by rendering an enhanced `ChatThinkingProgress` (or a new `ChatThinkingTerminal` sibling).
2. Optionally keep a lighter terminal shimmer inside `ChatThinkingTrace`’s empty live branch (`waiting` copy at ~line 108–111) until the first tool/reasoning step arrives.
3. Once `thinkingTrace` has steps, prefer the real trace (truthful) over fake terminal lines.

### Layout safety

| Constraint | Guidance |
|------------|----------|
| Progress shell is `max-w-xs` | Terminal stack should stay ≤ current bubble width; use `max-w-xl` only if matching `ChatThinkingTrace` |
| Trace accordion expands | Fake terminal should be fixed height (e.g. 3–5 lines) with `overflow-hidden` so it does not jump the thread |
| Reduced motion | Keep existing `prefers-reduced-motion` early-finish |
| Streaming content gate | Do not show fake terminal **and** partial markdown at once; current `waiting && hasThinking` gate already prevents that |

### Files to modify

| File | Change |
|------|--------|
| `components/app-shell/chat-thinking-progress.tsx` | Replace status `<p>` with blurred terminal line stack; faster rotate (~400–700ms); cosmetic labels (“Fetching order books…”, etc.) via i18n |
| `components/app-shell/chat-message.tsx` | Wire progress/terminal into `waiting && !hasThinking` |
| `messages/en.json` (+ ar/fa as needed) | Add terminal line strings under `workspace.thinkingProgress` |
| Optional: `chat-thinking-trace.tsx` | Empty-live placeholder polish |

### Blockers

- None for a purely cosmetic UI.
- Product risk: fake terminal lines can conflict with real tool names in `ChatThinkingTrace` if both show at once — gate on `!hasThinking`.

---

## 2. Ghost Premium Features (Tools Menu)

### Current state

Tools menu is **inline JSX** in `chat-composer.tsx` (`toolsMenuItems`), gated by `SHOW_COMPOSER_TOOLS_MENU = true`.

- Real item(s): `IRIS_MENTION_OPTIONS` from `lib/chat/composer-mentions.ts` (today only `"signal"`). Click → `insertMentionToken` → local tool chip / draft rewrite. **No API tool call.**
- Ghost item already exists: disabled “Analytics Charts” (`composerToolAnalyticsLabel` / `…Desc` = “Coming soon”).
- There is no separate `composerSignalMenu` symbol; i18n keys are `composerToolsMenu`, `composerToolSignal*`, `composerToolAnalytics*`.

### Feasibility: **High** (pure UI)

### Recommended approach

1. Extend `toolsMenuItems` with unlocked-looking but **non-disabled** rows (so click works): e.g. “Asset Correlation Analysis”, “Weekly Volatility Forecast”, each with a small `LockIcon`.
2. On click: close menu + open a `Dialog` (existing `components/ui/dialog.tsx`) with Plus copy + CTA to `UPGRADE_PATH` (`lib/site.ts`). For Plus users (`isProUser`), either hide locks or show “Coming soon” — product call.
3. **Do not** add these names to `CHAT_FRONTEND_TOOLS` / `available_ui_actions` — that would advertise fake tools to the backend.

`ChatComposer` currently has no `isProUser` prop; pass it from `chat-aside` (already has auth plan state) or read via `useAuth()`.

### Files to modify

| File | Change |
|------|--------|
| `components/app-shell/chat-composer.tsx` | Locked menu items + dialog state |
| `messages/*.json` | Labels, lock dialog body, CTA |
| Optional small extract | `lib/chat/composer-ghost-tools.ts` for the locked catalog |

### Blockers

- None.
- Avoid wiring locked items through `IrisMentionTool` union unless you want them in `@` mention palette too.

---

## 3. One-Click News Context (“Analyze” button)

### Current state

- Chat news: `ChatNewsSidePanel` / `ChatNewsMobileSheet` mount **inside** `chat-aside.tsx` and render `NewsBulletin`.
- Desk news: `dashboard.tsx` also uses `NewsBulletin` (sibling tree under `AppShell` / `ContextMain`) — **no shared composer state**.
- Composer draft is controlled by `chat-aside`: `draft` / `setDraft` / `handleSend`.
- Existing handoffs:
  - Sample prompts: `setDraft(text)` + `focusComposer()`
  - Landing auto-submit: `?q=` via `LANDING_CHAT_QUERY_PARAM` → `handleSendRef.current(question)`
- News card footer already has Copy / Source / Speak — natural place for Analyze (`NewsCardFooter` in `news-bulletin.tsx`).

There is **no** composer ref exposed outside `ChatAside`, and no existing “ask about news” callback.

### Feasibility: **High** (chat news panel); **Medium** (standalone dashboard news)

### Recommended approach

**A. Preferred for chat news panel (prop drilling — cleanest):**

```
chat-aside
  onAnalyzeNews(item) {
    const text = `"${item.title}"\n\nAnalyze the impact of this news on the current market structure.`
    setNewsOpen(false)           // optional UX
    void handleSend(text)        // auto-submit
    // or: setDraft(text); focusComposer() for review-before-send
  }
  → ChatNewsSidePanel / MobileSheet
    → ChatNewsPanelBody
      → NewsBulletin onAnalyzeNews={...}
        → NewsCard / NewsCardFooter Analyze button
```

**B. Cross-tree (dashboard → chat):** use a tiny event bus (repo already uses `CustomEvent` for session reset / consent), e.g. `exur:compose-and-send`, listened in `chat-aside`. Same payload as A.

**C. Avoid** reaching into composer textarea refs from the news tree — draft is React state; write `setDraft` / `handleSend`, not DOM.

### Auto-submit notes

- `handleSend` already guards `sending`, auth/guest trial, low-signal short-circuit.
- Prefer `handleSend(text)` over filling the textarea then simulating Enter — matches landing `?q=` path.
- If the user is mid-stream (`sending`), either queue or toast “wait for reply”.

### Files to modify

| File | Change |
|------|--------|
| `components/dashboard/news-bulletin.tsx` | `onAnalyzeNews?: (item: NewsItem) => void` + Analyze control in `NewsCardFooter` |
| `components/app-shell/chat-news-panel.tsx` | Thread callback through body/panel/sheet |
| `components/app-shell/chat-aside.tsx` | Implement handler; optionally close news panel |
| Optional: `dashboard.tsx` / `home-view.tsx` | Same callback via CustomEvent if desk news should Analyze too |
| `messages/*.json` | Button / aria labels |

### Blockers

- Dashboard news cannot call `setDraft` directly without a bridge (event or lifted context).
- Guest trial exhaustion: Analyze will hit the same guest paywall path as a normal send — acceptable, but expect connect CTAs.

---

## 4. Silent Personality Injection (Trading Profile)

### Current state

| Piece | Behavior |
|-------|----------|
| `buildChatClientContext` | Emits `active_page`, `active_symbol`, `role`, `locale`, `timezone?`, `available_ui_actions` |
| `ChatClientContext` type | Also allows `capabilities`, `timeframe`, `open_positions`, `draft_order` — **no profile field today** |
| Stream POST | Sends `client_context`; **does not** send `instructions` or `messages` |
| JSON POST (`sendCoPilotChat`) | Can send `instructions` (unused by stream path) |
| UI vs wire message split | Already exists for signals: UI/`history` use `summarizeSignalUserMessage(...)`, while `streamCoPilotChat({ message: userMessage })` sends the full `@signal …` command |

Account entry points: avatar → `ChatAccountSheet` views `"root" \| "settings" \| "theme" \| "language" \| "help"`. Natural home for a new `"tradingProfile"` view.

### Feasibility: **High for storage/UI; Medium for guaranteed LLM effect (backend contract)**

### Critical design constraint

You need the LLM to see profile text **without** showing it in the thread.

| Strategy | UI stays clean? | Server history stays clean? | Works with current stream client? | Backend required? |
|----------|-----------------|-----------------------------|-----------------------------------|-------------------|
| **A. Extend `client_context`** (e.g. `trading_profile: {…}` or compact string) | Yes | Yes (not in `message`) | Yes — already sent every turn | **Yes** — API must fold into system/developer prompt |
| **B. Send `instructions` on stream** | Yes | Yes | Needs `streamCoPilotChatOnce` body change | **Yes** — API must honor `instructions` on stream |
| **C. Append to `message` only on wire** | Yes locally if UI uses short text | **No** — server stores fat user message; sync/`stampUiMessageFromRef` can rehydrate it into the bubble | Yes | No |
| **D. Mutate `history` / fake system message before fetch** | N/A locally | N/A | **No** — `messages[]` not sent on stream | Would need API change |

**Recommendation: Strategy A (client_context), with B as fallback if product/backend prefers `instructions`.**

Do **not** rely on mutating a `messages` array at the fetch boundary — that array is not on the wire for the live path.

### Implementation sketch (Strategy A)

1. **Storage:** `lib/trading-profile.ts` — schema + `localStorage` get/set (experience, country, target market, bio). Keep payload small (cap bio length).
2. **UI:** new sheet view in `chat-account-sheet.tsx` (+ menu row in `chat-account-menu-sections.tsx`).
3. **Context merge:** extend `buildChatClientContext` / `useChatClientContext` to attach:

   ```ts
   trading_profile?: {
     experience_level?: string
     country?: string
     target_market?: string
     bio?: string
   }
   ```

4. **Types:** extend `ChatClientContext` in `lib/api/types.ts`.
5. **Send path:** no change to optimistic UI message / local `history` — profile never enters `ChatUiMessage.content`.
6. **Guest:** `toGuestClientContext` strips only `role`; profile fields would still pass unless you intentionally omit them for guests.

### Anti-patterns to avoid

- Prefacing every visible user bubble with a hidden system block in React state — history sync and retry paths will leak it.
- Appending profile into `userMessage` “just for the API” without a display/wire split **and** without stripping on server echo — `stampUiMessageFromRef(m, result.userMessage)` can overwrite the optimistic short text with the server’s stored message.

### Files to modify

| File | Change |
|------|--------|
| `lib/trading-profile.ts` (new) | Schema + localStorage |
| `components/app-shell/chat-account-sheet.tsx` | Form view |
| `components/app-shell/chat-account-menu-sections.tsx` | Entry row |
| `lib/api/types.ts` | `ChatClientContext.trading_profile?` |
| `lib/chat/client-tools.ts` | Merge profile in `buildChatClientContext` |
| `hooks/use-chat-client-context.ts` | Recompute when profile changes (storage event / version state) |
| Optional: `lib/api/co-pilot.ts` | If choosing Strategy B, add `instructions` to stream body |

### Blockers

1. **Backend contract (main blocker):** Confirm `api.exur.ai` forwards unknown / new `client_context` fields into the model prompt. If it allowlists fields, FE injection alone will silently no-op.
2. If backend only reads `instructions`, stream client must be updated — JSON path already supports it.
3. Privacy: localStorage profile is device-local; document that it is not synced across devices unless you add API persistence later.
4. Token budget: truncate bio; send structured fields, not a multi-KB essay every turn.

---

## 5. Interactive Educational Tooltips

### Current state

- Assistant prose: `AIMessageRenderer` → `prepareAssistantMarkdown` → `marked.parse` → `DOMPurify.sanitize` → `dangerouslySetInnerHTML`. **No React tree inside the message body.**
- Signal card: plain `<p>` / reason strings from `PaperTradeTicket` (`setup`, `thesis`, `entryReason`, etc.) in `ChatSignalCard`. There is no `PaperTradeTicket` React component — only the data type + `ChatSignalCard`.
- Tooltip primitive: `components/ui/tooltip.tsx` uses **Base UI** (`@base-ui/react/tooltip`), not Radix. Same UX goal; prefer this for design-system consistency.
- DOMPurify forbids `style`, form controls, `svg`, etc.; custom interactive wrappers inside sanitized HTML are hostile to React portals.

### Feasibility: **High for ChatSignalCard; Medium for assistant markdown**

### Recommended approach

**Split by surface:**

#### A. `ChatSignalCard` (safest)

Create `TermText` / `withGlossaryTerms(text)` that tokenizes known terms (VWAP, ATR, Order Block, …) in plain strings and wraps matches in `<Tooltip>` triggers. Apply to `setup`, `thesis`, and reason fields only. Numeric tiles stay untouched.

#### B. Assistant markdown (safer progressive enhancement)

Avoid rewriting the whole renderer to `react-markdown` in v1.

1. In `prepareAssistantMarkdown` **or** a post-`marked` HTML pass, wrap whole-word terms in:

   ```html
   <abbr class="chat-term" data-term="VWAP" title="Volume Weighted Average Price">VWAP</abbr>
   ```

2. Allow `abbr` + `data-term` / `title` through DOMPurify (`ADD_TAGS` / `ADD_ATTR` as needed).
3. Optionally enhance with a single document-level pointer listener that finds `.chat-term` and opens the shared Base UI tooltip — **no React children inside `dangerouslySetInnerHTML`**.

#### C. Full React markdown (larger refactor)

Swap to `react-markdown` + custom `text`/`strong` components — most flexible, highest blast radius (tables, GFM, streaming deferral already use `useDeferredValue`).

### Safety rules

- Skip replacements inside fenced code / inline `code` (markdown prep already has code-fence awareness).
- Word-boundary matching; avoid replacing inside URLs.
- Glossary map in `lib/chat/glossary-terms.ts` + i18n definitions.
- Do not wrap inside `PriceTile` numeric values.

### Files to modify

| File | Change |
|------|--------|
| `lib/chat/glossary-terms.ts` (new) | Term → definition map |
| `components/app-shell/term-text.tsx` (new) | React wrapper for plain strings |
| `components/app-shell/chat-signal-card.tsx` | Use `TermText` on prose fields |
| `lib/prepare-assistant-markdown.ts` and/or `ai-message-renderer.tsx` | HTML term wrap + Purify allowlist |
| `messages/*.json` | Definitions if i18n’d |

### Blockers

- Pure React tooltips **inside** sanitized HTML without event delegation = broken. Choose abbr/`title` or delegated Base UI tooltip.
- Streaming: re-wrapping on every deferred chunk is fine if the pass is cheap and idempotent.
- Landing demo `ChatSignalCard` (`signal-wait-section.tsx`) will pick up the same term wrapping — usually desirable.

---

## Cross-cutting notes

### Extension parity

`apps/extension/src/...` duplicates many of these modules. Ship web first; sync extension copies in the same PR or a follow-up to avoid drift.

### Auth / Plus

- Ghost tools + upgrade dialog: reuse `UPGRADE_PATH` / existing Plus badge patterns in account menus.
- Analyze + profile work for guests; profile injection should be explicit about guest vs registered.

### Suggested implementation order

1. **Ghost tools** — smallest, isolated to composer  
2. **Thinking terminal** — wire orphaned progress into waiting state  
3. **News Analyze** — prop callback inside chat news panel  
4. **Glossary tooltips** — signal card first, markdown second  
5. **Trading profile** — UI + localStorage, then client_context; **confirm API** before declaring LLM personalization done  

### Effort / risk matrix

| Feature | Effort | Risk | Backend needed? |
|---------|--------|------|-----------------|
| 1 Terminal thinking | S–M | Low (layout/motion) | No |
| 2 Ghost premium tools | S | Low | No |
| 3 News Analyze | S–M | Low (cross-tree if dashboard) | No |
| 4 Silent profile | M | **Medium** (history leak if wrong strategy; silent no-op if API ignores context) | **Yes for effect** |
| 5 Tooltips | M | Medium (markdown/sanitize) | No |

---

## Open questions before implementation

1. Should fake thinking lines hide as soon as the first real SSE tool/reasoning step arrives? (**Recommended: yes.**)
2. For locked tools: show to Plus users as “Coming soon”, or hide entirely?
3. News Analyze: auto-submit vs fill-composer-only?
4. Does Iris API already forward arbitrary `client_context` keys into the prompt, or is there an allowlist? Who owns adding `trading_profile` / stream `instructions`?
5. Glossary language: English-only terms with localized definitions, or locale-specific term lists (AR/FA)?

---

## Appendix — exact inject points (quick reference)

```
#1 Thinking
  chat-message.tsx → ChatAssistantTurn (waiting && !hasThinking)
  chat-thinking-progress.tsx → UI replacement

#2 Ghost tools
  chat-composer.tsx → toolsMenuItems (+ Dialog)
  NOT client-tools CHAT_FRONTEND_TOOLS

#3 Analyze
  news-bulletin.tsx → NewsCardFooter
  chat-news-panel.tsx → props
  chat-aside.tsx → handleSend / setDraft

#4 Profile (silent)
  chat-account-sheet.tsx → form + localStorage
  buildChatClientContext / ChatClientContext → trading_profile
  co-pilot stream already sends client_context
  DO NOT append into visible messages[] / UI history

#5 Tooltips
  chat-signal-card.tsx → TermText on prose
  ai-message-renderer / prepare-assistant-markdown → abbr or delegated tooltip
  components/ui/tooltip.tsx → Base UI primitive already in tree
```
