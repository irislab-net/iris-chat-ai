/**
 * # Staking notification specification (single source of truth)
 *
 * **Phase 1 —** philosophy, durations, dedupe philosophy, success-channel targets.
 *
 * **Phase 2 —** notification **event matrix**, ownership, precedence, resume/BFCache
 * rules, persistence, and explicit high-risk scenarios (§15–§22).
 *
 * **Phase 4 —** canonical dedupe ids, copy/severity convergence notes, adoption map,
 * MTX review (§23–§27). Helpers live in `@/staking/ui`.
 *
 * **Phase 5 —** mobile placement + safe-area layout tokens (§28–§35). Implemented in
 * `@/constants/stakingNotificationLayout.ts` + responsive `Toaster` in `components/ui/sonner.tsx`.
 *
 * Call sites are **not** required to import this file until helpers (Phase 3+)
 * adopt these exports; runtime behavior changes land in later phases only.
 *
 * ## Stack invariant
 *
 * - **Sonner remains the toast stack.** Do not replace it with another library.
 * - This module does **not** wrap Sonner at runtime in Phase 1; it defines **what**
 *   future `showStakingToast`-style helpers and call sites **must** converge toward.
 *
 * ## Relationship to `stakingModalSpec.ts`
 *
 * - Modals/sheets own **rich, blocking, multi-step** flows (tx lifecycle, consent,
 *   Telegram unsupported). See `STAKING_MODAL_Z_INDEX` for stacking vs overlays.
 * - Toasts own **lightweight, non-blocking** acknowledgements and **background**
 *   failures when no modal owns the message. Z-index verification against the modal
 *   ladder is a **Phase 5 / 8** task; default Sonner positioning must not visually
 *   fight the transaction bottom sheet on mobile once positioning is normalized.
 *
 * ## Non-goals (global)
 *
 * - Does not rewrite `TransactionStatusProvider`, receipt waits, persistence, or
 *   AppKit integration.
 * - Does not change copy in `stakingUserFacingErrors` or vault hooks until later
 *   phases explicitly migrate strings to helpers that read from here.
 *
 * @see `stakingModalSpec.ts` — modal geometry, safe-area on sheets, z-index ladder
 */

// =============================================================================
// 1. Notification hierarchy philosophy
// =============================================================================
//
// **Order of precedence (conceptual):**
//
// 1. **Blocking modal / sheet** — user must see and act inside the surface (tx
//    lifecycle, terms, destructive confirm, Telegram unsupported).
// 2. **Inline / in-context UI** — field errors, banners inside a panel, button
//    state ("Copied"), `Alert` inside a form (e.g. MTX dialog).
// 3. **Toast (Sonner)** — transient, global, non-blocking: confirms background
//    work, warns when no better owner exists, or **fallback** when the owning modal
//    is not visible.
//
// **Rule of thumb:** if the user is already staring at the right surface, do not
// add a toast that repeats the same fact unless the spec's success-channel or
// dedupe policy explicitly allows it.

// =============================================================================
// 2. Modal vs toast precedence (Phase 2 — normative rules; implement gradually)
// =============================================================================
//
// These rules are **target behavior** for Phase 7+ emission policy. Until then,
// existing code may diverge; migrations should close gaps without big-bang refactors.
//
// | Situation | Owner | Toast? |
// |-----------|--------|--------|
// | Tx pending / signing / submitted / confirming | Transaction modal | **No** (modal only) |
// | Tx success while tx modal open and showing success | Modal | **No** — avoid duplicate celebration |
// | Tx success after user closed/dismissed modal before confirmed | Toast (optional) | **Yes** — single success, deduped by tx hash |
// | Tx failure while tx modal visible and surfacing error | Modal | **No** |
// | Tx failure when modal cannot show error (e.g. dismissed, not mounted) | Toast | **Yes** — same copy shape as modal errors |
// | Wallet / network / gas / indexer (no tx modal owner) | Toast (or inline where exists) | **Yes** / deduped |
// | Destructive or irreversible confirm | Modal (or dedicated confirm pattern) | **No** for the confirm itself; post-result may toast if modal closed |
// | Terms acceptance, storage failure | Modal flow + toast on hard failure | **Yes** for rare storage errors |
// | Clipboard / referral copy failure | Toast or inline | **Yes** today — keep until unified |
//
// **Wallet rejections:** never toast for explicit user rejection (already filtered
// in receipt path); keep that invariant.
//
// **Background failures:** indexer, affiliate list, RPC meta — toast with stable
// dedupe keys and summarized copy (no raw RPC bodies).
//
// **Exhaustive event-level matrix:** §15 (Phase 2). Use that section when adding
// new flows so every event has one authoritative surface before code changes.

// =============================================================================
// 3. Severity semantics
// =============================================================================
//
// Map product severity → Sonner API **usage** (not redesign of Sonner internals):
//
// - **error** — something failed or is blocking progress; user should correct or retry.
// - **warning** — risk or degraded state (gas low, rate limit); user may proceed but
//   should be aware. *Today many warnings use `toast.error`; normalization prefers
//   `toast.warning` only when copy and color align with design — Phase 6.*
// - **success** — completed action or recovered state; keep concise.
// - **info / default** — neutral FYI; use sparingly to avoid noise. Prefer `toast`
//   or explicit `toast.message` only when semantics are not success/error.
//
// **Destructive** is not a Sonner severity; it is a **modal** pattern with explicit
// copy and actions.

/** Canonical severity labels for helpers and analytics (Phase 3+). */
export type StakingNotificationSeverity = "error" | "warning" | "success" | "info"

// =============================================================================
// 4. Success / warning / error / info definitions
// =============================================================================
//
// - **Success:** short **title**; optional **description** one line max. No noop
//   action buttons. Use `toast.success` once MTX and staking agree (Phase 6).
// - **Warning:** title + optional description; duration may be slightly longer than
//   success (see `STAKING_NOTIFICATION_DURATION_MS`).
// - **Error:** title + optional description; never leak raw JSON-RPC / HTTP bodies.
// - **Info:** neutral title; avoid stacking multiple info toasts in one gesture.
//
// **Copy rhythm:** Title = outcome or problem in few words. Description = one
// concrete next step or reason, not stack traces.

// =============================================================================
// 5. Mobile positioning philosophy
// =============================================================================
//
// **Problem statement:** bottom-right stacks compete with staking **bottom sheets**
// and thumb reach on narrow viewports.
//
// **Target direction (evaluate before Phase 5 rollout):**
//
// - **Desktop (md+):** `bottom-right` — aligns with common desktop patterns, away
//   from centered modals.
// - **Mobile (`max-md`):** prefer **bottom-center** (or inset horizontal + bottom)
//   with horizontal margin so toasts sit in the thumb zone without overlapping sheet
//   drag handles; exact Tailwind/Sonner `position` split is an implementation detail
//   of Phase 5.
//
// Until Phase 5 ships, **document only** — global `App.tsx` / `sonner.tsx` position
// stays as today to avoid surprise regressions.

/**
 * Tailwind breakpoint label for **product** “mobile” copy/layout elsewhere.
 * **Sonner’s own mobile toaster CSS uses `max-width: 600px`** — Phase 5 `matchMedia`
 * for toast `position` aligns with `@/constants/stakingNotificationLayout.ts`, not `md`.
 */
export const STAKING_NOTIFICATION_MOBILE_BREAKPOINT = "md" as const

// =============================================================================
// 6. Safe-area philosophy
// =============================================================================
//
// - Toasts must respect `env(safe-area-inset-bottom)` (and horizontal insets on
//   notched devices) so they are not clipped by home indicators.
// - Sheet **content** safe-area is owned by `stakingModalSpec` (`STAKING_MODAL_SAFE_AREA_*`);
//   toast safe-area is **independent** and must add padding **below** the visual
//   toast stack, not assume sheets are closed.
// - Phase 5 implements via host `className` / style on `<Toaster />` or Sonner
//   CSS variables — not in Phase 1.

// =============================================================================
// 7. Toast duration standards (ms) — SSOT for future helpers
// =============================================================================

/** Default durations for staking-owned toasts; MTX may adopt the same in Phase 6. */
export const STAKING_NOTIFICATION_DURATION_MS = {
  /** Success acknowledgements — brief */
  success: 4_000,
  /** Errors user should read */
  error: 6_000,
  /** Warnings / degraded state */
  warning: 5_500,
  /** Neutral info */
  info: 4_500,
  /** Promise / long-running (if introduced later) — upper bound before auto-dismiss */
  promiseSettled: 5_000,
} as const

export type StakingNotificationDurationKey = keyof typeof STAKING_NOTIFICATION_DURATION_MS

/**
 * Prefix for Sonner `id` and shared semantic dedupe keys (§19).
 * Helpers build `staking:notif:<domain>:<event>[:<fingerprint…>]` — see
 * `createStakingToastDedupeKey` and `stakingToastDedupeFingerprint` in `@/staking/ui`.
 */
export const STAKING_NOTIFICATION_DEDUPE_NAMESPACE_PREFIX = "staking:notif:" as const

// =============================================================================
// 8. Dedupe philosophy
// =============================================================================
//
// - **Stable keys:** semantic identity via `staking:notif:<domain>:<event>[:fingerprint]`
//   (see §23); use `stakingToastDedupeFingerprint` for volatile raw strings. Receipt:
//   `tx_receipt:${hash}` pattern when toast layer dedupes (Phase 7+).
// - **One toast per key per "session slice":** reset keys when the underlying condition
//   clears (e.g. user switches to correct chain → wrong-network key resets).
// - **Rising edge:** fire when entering a bad state, not on every re-render — pattern
//   already documented in `useStakingGasToastDedupe`.
// - **Namespaces:** canonical `staking:notif:…` ids from `createStakingToastDedupeKey`
//   (Phase 4) to avoid cross-feature collisions.
//
// **Do not weaken:** receipt success Set-by-hash, wrong-network once-per-wrong-chain
// slice, RPC meta once-until-success, gas rising-edge — preserve behavior while
// centralizing **shape** of dedupe (Phase 4).

// =============================================================================
// 9. Transaction notification philosophy
// =============================================================================
//
// - **Primary UX:** `TransactionStatusSurface` + snapshot state own the narrative
//   (preview → signature → submitted → confirming → confirmed / failed).
// - **Receipt wait:** background; completion updates modal **and** may emit toast per
//   **success-channel policy** (section 10).
// - **Mobile resume / persistence:** toasts are ephemeral; **never** rely on a toast
//   as the only record of tx state. Modal + persistence remain authoritative.
// - **Dedupe:** success toast keyed by **tx hash** to survive double resolution / strict
//   mode quirks.

// =============================================================================
// 10. Success-channel policy (resolves modal + toast duplication)
// =============================================================================
//
// **Default (target):**
//
// - If the transaction modal is **open** and transitions to **confirmed** with
//   success UI visible → **suppress** success toast (modal is sufficient).
// - If the modal is **closed** or **not showing** confirmed state when receipt lands
//   → emit **one** `toast.success` with the same human-readable amount/scenario copy,
//   deduped by hash.
//
// **Implementation note:** requires the emitter (`registerReceiptCompletion` or a thin
// wrapper) to read dialog visibility / phase — Phase 7, small conditional only.
//
// **Failures:** modal owns errors when open; toast only as fallback when the error
// cannot be surfaced in the modal (already partially implemented).

// =============================================================================
// 11. Loading / pending policy
// =============================================================================
//
// - **No Sonner loading toasts for staking tx today** — intentional: the modal shows
//   pending states with deterministic copy.
// - **Do not** introduce `toast.promise` for standard deposit/withdraw without product
//   sign-off; it competes with the modal and confuses mobile resume.
// - **Optional future use:** short `toast.loading` only for **non-modal** async work
//   (e.g. one-off export) with guaranteed dismissal — not Phase 1–3 default.
//
// **Route / bootstrap loading:** `InitialSplashOverlay`, `RouteLoadingFallback` — not
// toasts; do not conflate.

// =============================================================================
// 12. Global stacking philosophy
// =============================================================================
//
// - **Single `<Toaster />`** at app root — one stack for staking + MTX + future routes.
// - **Order:** newer toasts stack per Sonner defaults; avoid firing >2 toasts for one
//   user action.
// - **Rich in-dialog alerts** (e.g. MTX `Alert`) are **not** toasts; they stack inside
//   the dialog and follow dialog scrolling — no change to that pattern in Phase 1.
//
// **Z-index:** toasts must remain **below** `InitialSplashOverlay` (`z-[9999]`) and
// must not obscure the transaction modal (`STAKING_MODAL_Z_INDEX.transaction*`).
// Verify Sonner portal z-index vs modal ladder when touching global styles (Phase 5/8).

// =============================================================================
// 13. Mobile behavior (summary)
// =============================================================================
//
// - Prefer **bottom** placement on small viewports; respect safe-area; avoid overlap
//   with sheet handles and primary CTAs.
// - **Swipe to dismiss:** Sonner default — keep unless a11y review says otherwise (Phase 9).
// - **Reduce motion:** honor `prefers-reduced-motion` for toast enter/exit when
//   customizing (Phase 9); if untouched, rely on Sonner defaults until reviewed.

// =============================================================================
// 14. Accessibility expectations
// =============================================================================
//
// - Toasts should map to **live regions** appropriately (Sonner handles much of this);
//   do not double-announce with `aria-live` on page chrome when a toast already announces.
// - **Actions:** action buttons must have visible name, focus order, and not be no-ops
//   (MTX "Ok" should dismiss or be removed — Phase 6).
// - **Keyboard:** users must be able to dismiss toasts without a pointer (Sonner
//   defaults + Escape where applicable).
// - **Focus trap:** modal focus traps must not be broken by toast focus management;
//   toasts are **non-modal** surfaces — no programmatic focus move into a toast on open
//   unless product requires it (default: no).
// - **Color alone:** severity must not rely only on color; title text carries meaning.

// =============================================================================
// 15. PHASE 2 — Notification event matrix (staking + shared toaster context)
// =============================================================================
//
// **Legend (columns used in each row):**
// - **Source** — where the event originates in code/architecture.
// - **Current** — what the user sees today (may differ from intent until Phase 7+).
// - **Dup risk** — modal+toast, double toast, or unclear ownership.
// - **Authority** — single owner for user-meaningful communication (target).
// - **Toast / Modal / Inline** — `Y` = allowed primary/fallback, `N` = do not use,
//   `Fb` = toast **fallback only** when authority surface cannot show the message.
// - **Persist** — must survive navigation/refresh (`session`/`local`/`chain` state),
//   not ephemeral toast.
// - **Dedupe** — required stable key namespace (see §19).
// - **Mob / Bg** — mobile-only or background/resume-specific policy (see §18).
// - **A11y** — focus/live region expectations (see §14).
//
// Row template:
// `Event | Source | Current | Dup risk | Authority | Toast | Modal | Inline | Persist | Dedupe | Mob/Bg | A11y`
//
// ---
// ### 15.1 Transaction lifecycle (`TransactionStatusProvider` + `TransactionStatusSurface`)
//
// | Event | Source | Current | Dup risk | Authority | T | M | Inline | Persist | Dedupe | Mob/Bg | A11y |
// |-------|--------|---------|----------|-----------|---|----|--------|---------|--------|--------|------|
// | Preview open | User confirms amount / open flow | Tx modal `preview` | Low | Tx modal | N | Y | fee row inline | snapshot/session later | N | Sheet layout | Focus per `stakingModalSpec` |
// | Awaiting signature | Wallet prompt | Tx modal `awaiting_signature` | Low | Tx modal | N | Y | CTA hints | Y (persist if broadcast later) | N | Resume: ignore spurious Radix close | No toast steal focus |
// | Submitted (hash) | `setSubmitted` | Tx modal `submitted` + hash | Low | Tx modal | N | Y | explorer link optional | Y | N | Same | — |
// | Confirming | `setConfirming` / receipt wait | Tx modal `confirming` | Low | Tx modal | N | Y | progress UI | Y | N | Background: modal persists | — |
// | Confirmed (receipt ok) | `registerReceiptCompletion` then | Modal → `confirmed` **and** `toast.success` | **High** — same fact twice | **Modal**; toast **Fb** if modal not showing confirmed | Fb | Y | success footer | Y | **Y** `tx_receipt_ok:${hash}` | Bg settle: toast if modal closed per §18 | Success announced once |
// | Failed (receipt err, modal can show) | `registerReceiptCompletion` catch | Modal `failed` | Low | Tx modal | N | Y | error string | Y | N | — | Error in modal |
// | Failed (receipt err, modal cannot show) | same, `surfacedInModal===false` | `toast.error` | Medium if also logged | Toast **Fb** | Y | Fb | — | snapshot may idle | N | — | Toast readable |
// | Failed (pre-receipt / wallet / hook) | forms + `setFailed` | Modal `failed` (+ toast if dismissed — see §18) | Medium | Tx modal primary; toast **Fb** | Fb | Y | — | Y | stage-based | Dismiss path | — |
// | Cancelled (user dismiss in-flight) | `beginInFlightDismissal` | Modal `cancelled` epilogue → `close` | Low | Tx modal only | N | Y | — | clears persisted session on close paths | N | Mobile: `stakingMobileResumeStore` suppress spurious close | No success toast |
// | Wallet user-rejected | signer/receipt errors | Modal or silent catch | Low if filtered | Inline/modal copy; **no toast** | **N** | Y | — | N | **N** | — | Do not shame user |
// | Pending (deprecated phase) | legacy | Treated as in-flight modal family | Low | Tx modal | N | Y | — | Y | N | — | — |
// | Replaced / dropped / speed-up | RPC / wallet edge | **No dedicated staking UI** today | Ambiguous | Until product spec: **history/explorer** + modal if hook maps to `failed` | Fb | Fb | — | chain truth | **Y** if toast used | After reconnect, prefer modal refresh | §22 |
// | Resumed after reload | `readPersistedStakingTxSession` + reconcile | Modal may reopen | Low vs dup toast | Tx modal restores narrative | Fb | Y | — | **sessionStorage** | receipt hash set | Reload: no duplicate success if hash in set | — |
// | Resumed after BFCache | `pageshow` persisted + vault refresh; tx dialog guarded | Modal may stay open / coerced | Medium vs toast | Tx modal | Fb | Y | — | same persist | same | **§18 BFCache** | — |
// | Settled while modal closed | receipt resolves after user dismissed | Success toast **today always fires** if hash not deduped | **High** | Toast **only** (modal absent); suppress if user intentionally cancelled **and** hash abandoned — product edge §22 | Y | N | — | N | **Y** hash | Bg tab: toast visible when foreground | — |
//
// ---
// ### 15.2 Wallet / network (`useStakingVault`, forms, gas hook)
//
// | Event | Source | Current | Dup risk | Authority | T | M | Inline | Persist | Dedupe | Mob/Bg | A11y |
// |-------|--------|---------|----------|-----------|---|----|--------|---------|--------|--------|------|
// | Wrong network (vault switch path) | `useStakingVault` | `toast.error` once | **Medium** vs indexer “Wrong network” toast | **Toast** until unified banner; single namespace | Y | N | network CTA UI optional | N | **Y** `wallet:wrong_network` | Same | Clear title |
// | Wrong network (indexer error) | `StakingAppErrorSurface` | `toast.error` summarized | **Medium** vs vault | Toast; merge copy in Phase 6+ | Y | N | — | N | **Y** `indexer:${raw}:wrongNet` | — | — |
// | RPC / token meta failed | `loadMeta` catch | `toast.error` once until success | Low | Toast | Y | N | — | N | **Y** `vault:rpc_meta` | Retry on chain fix | — |
// | Gas insufficient / near zero ETH | `useStakingGasToastDedupe` | `stakingToastWarning` + rising edge | Low | Toast (warning) | Y | N | form disabled state | N | **Y** `staking:notif:gas:…` + ref | — | — |
// | Reconnect / provider back | AppKit + vault hooks | Silent refresh / UI update | Low | **None** (implicit state); optional info toast discouraged | N | N | balance UI | N | N | After resume, **no** flood | — |
// | Disconnected | wallet disconnect | UI idle / empty address | Low | Inline empty states | N | N | Y | N | N | — | — |
// | Awaiting signer (provider lag) | vault context | Modal / disabled CTA | Low | Inline + modal, not toast | N | Y | Y | N | N | — | — |
//
// ---
// ### 15.3 Referral (`useStakingReferral`, `StakingAppReferral`)
//
// | Event | Source | Current | Dup risk | Authority | T | M | Inline | Persist | Dedupe | Mob/Bg | A11y |
// |-------|--------|---------|----------|-----------|---|----|--------|---------|--------|--------|------|
// | Copied referral link | clipboard OK | Inline “Copied” / `referralCopied` | Low | **Inline** | N | N | Y | N | N | — | `sr-only` patterns exist |
// | Copy failed | clipboard fail | `toast.error` | Low | Toast **Fb** (or inline error near button) | Y | N | Fb | N | **Y** `referral:copy_fail` | Secure context copy | Toast |
// | Referral saved (URL capture) | `useStakingReferral` | **Dialog** “Referral link saved” | Low | **Dedicated modal** | N | Y | — | **localStorage** | N | Telegram: **skipped** by design | Focus primary CTA |
// | Invalid referral (edit) | parse + self-ref check | `editFieldError` inline | Low | **Inline** | N | N | Y | N | N | — | Error text in dialog |
// | Referral removed | confirm dialog + storage | Manage modal + confirm | Low | **Modal** | N | Y | — | localStorage | N | — | Destructive confirm |
//
// ---
// ### 15.4 Telegram unsupported (`TelegramEscalationProvider` + dialog)
//
// | Event | Source | Current | Dup risk | Authority | T | M | Inline | Persist | Dedupe | Mob/Bg | A11y |
// |-------|--------|---------|----------|-----------|---|----|--------|---------|--------|--------|------|
// | Unsupported in-app browser | `isTelegramBrowser` + route gate | Blocking **modal** | Low vs toast | **Dedicated modal** (never AppKit) | N | Y | — | URL capture storage | N | Telegram only | Primary CTA focus |
//
// ---
// ### 15.5 Indexer / history / affiliate list
//
// | Event | Source | Current | Dup risk | Authority | T | M | Inline | Persist | Dedupe | Mob/Bg | A11y |
// |-------|--------|---------|----------|-----------|---|----|--------|---------|--------|--------|------|
// | Staking tx history indexer error | vault + `StakingAppErrorSurface` | `toast.error` summarized | Low | Toast | Y | N | optional empty state | N | **Y** indexer key | — | — |
// | Affiliate history error | `StakingAppTransactionHistory` | `toast.error` | Low | Toast (+ inline empty) | Y | N | Y | N | **Y** `affiliate:${raw}` | — | — |
//
// ---
// ### 15.6 MTX (marketing route)
//
// Legacy ICO buy / Rubic swap dialog was **removed in P4** (unused, not routed). MTX notifications
// are out of scope for staking vault spec until a product-owned surface ships again.
//
// =============================================================================
// 16. Ownership rules (normative)
// =============================================================================
//
// 1. **Single authority:** For any discrete user-meaningful outcome (success, hard
//    failure, blocking warning), exactly **one** primary surface (`Authority` column)
//    owns the narrative for that moment.
// 2. **Toast is never authority** for in-flight transaction state — only fallback,
//    background, or global health (gas, indexer, RPC) where no modal is appropriate.
// 3. **Persistence authority:** Transaction state = `TransactionStatusProvider`
//    snapshot + `stakingTxSessionPersistence`; referral = `localStorage`; never toast.
// 4. **Cross-feature toasts** (indexer vs wallet wrong-network) must converge to one
//    semantic message via shared copy+dedupe namespace (Phase 4–6), not duplicate fires.
// 5. **MTX** owns MTX dialog inline errors; staking matrix above documents MTX only
//    for toaster consistency, not vault coupling.

// =============================================================================
// 17. Modal vs toast precedence rules (formal)
// =============================================================================
//
// **P1 — Tx in-flight:** Modal only; **no** toasts for phase transitions
// (preview → confirming).
//
// **P2 — Tx success:** Modal is sufficient. Emit success toast **only if** the
// confirmed UI is **not** visible to the user (modal closed / idle snapshot / other
// route). Always **dedupe by tx hash**.
//
// **P3 — Tx hard failure:** Modal if open and bound to the failing tx; else toast
// fallback with same `getStakingTransactionErrorMessage` shape.
//
// **P4 — User reject:** Never toast; optional subtle inline/modal dismiss only.
//
// **P5 — Global health (gas, RPC, indexer, wrong network):** Toast (or future
// inline banner) with dedupe; never replace tx modal.
//
// **P6 — Referral / Telegram / terms:** Dedicated modal or inline; toast only for
// rare failures (storage, clipboard).

// =============================================================================
// 18. Background, mobile, BFCache, reload — high-risk scenarios
// =============================================================================
//
// **Modal visible vs closed**
// - Visible and bound to active tx: **all** terminal outcomes go to modal first;
//   success toast **suppressed** (target P2; today success toast may still fire — Phase 7).
// - Closed while tx in-flight: persisted session may rehydrate modal; if truly idle,
//   receipt completion uses **toast fallback** + vault refresh; hash dedupe prevents spam.
//
// **Tx settled while app backgrounded / tab hidden**
// - Modal state persists; on visible, user sees updated phase. Toast may appear when
//   tab returns — **acceptable** only if P2 satisfied (avoid duplicate with visible modal).
// - Prefer: update modal snapshot first; emit toast only if modal is not showing confirmed.
//
// **Mobile browser resume / wallet deep link**
// - `stakingMobileResumeStore` + `TransactionStatusSurface` ignore spurious `onOpenChange`
//   during handoff; **do not** add toasts on resume for healthy reconnect.
// - Vault refresh may run; no new toast unless a **new** error condition rises (dedupe).
//
// **BFCache restore (`pageshow.persisted`)**
// - Treat like resume: modal ownership unchanged; **suppress** “welcome back” toasts.
// - If snapshot reconciles to terminal: authority remains modal if reopened; else toast
//   fallback per P2/P3.
//
// **Reload recovery**
// - Session rehydrate is authoritative; success toast dedupe Set survives in-memory
//   only **per full page load** — after reload, **allow** one success toast if modal
//   does not show confirmed (user might have missed prior toast). **Dedupe still per hash**
//   within the new page lifetime.
//
// **User-dismissed modal during tx (`dismissedPanelDuringWalletRef`)**
// - Forms route wallet errors to `setFailed` + **conditional** `toast.error` when user
//   dismissed during wallet — **intended fallback**; modal may be absent. Risk: double
//   error if modal still visible — Phase 7 should assert `!dialogOpen` before toast.
//
// **Wallet rejection after modal dismissed**
// - Same path as above; **no** toast for explicit user reject codes; if classified as
//   reject, silent or inline only.
//
// **Tx completion after reconnect / provider reconnect**
// - Receipt promise may settle late; modal + vault refresh reflect truth. Toast policy
//   follows P2/P3. **No** extra “reconnected” toast (silent recovery preferred).

// =============================================================================
// 19. Dedupe requirements (by event family)
// =============================================================================
//
// | Family | Required | Reset / scope |
// |--------|----------|----------------|
// | Receipt success | **Yes** — `tx_receipt_ok:${hash}` (or equivalent) | Per page load + logical close |
// | Receipt failure fallback toast | Optional key on `(hash, stage)` if repeated retries | New submission |
// | Gas warnings | **Yes** — rising-edge keys | Cleared when disconnected / wrong network / tx in flight |
// | Wrong network (vault) | **Yes** — single shot until on expected chain | Chain matches expected |
// | Indexer / affiliate errors | **Yes** — stable raw or normalized bucket | Error clears |
// | RPC meta | **Yes** — once until successful meta load | Successful `loadMeta` |
// | Clipboard / referral copy | **Yes** — per gesture or cooldown (Phase 4) | New gesture |
// | MTX success | Optional Phase 4 | User action |

// =============================================================================
// 20. Persistence requirements
// =============================================================================
//
// | State | Must persist | Must NOT rely on toast |
// |-------|--------------|-------------------------|
// | Open tx flow | session per vault rules | Yes — user returns via modal |
// | Terminal tx outcome | chain + history queries | Yes |
// | Referral address | localStorage | Yes |
// | Telegram preserved URL | session/local per `originalTelegramUrl` | Yes |
// | Terms acceptance | localStorage | Yes |
// | Toast content | — | **Never** required for correctness |

// =============================================================================
// 21. Recommended future helper architecture (Phase 3–4, not implemented here)
// =============================================================================
//
// - **Thin façade** over Sonner: `emitStakingNotification({ eventId, severity, title,
//   description, dedupeKey, toastPolicy: "primary" | "fallback" | "never", modalAware })`.
// - **Modal awareness:** inject `() => snapshot` reader or boolean `isTxModalShowingConfirmed`
//   from context **inside** the helper’s callsite bundle, not global singletons.
// - **Dedupe registry:** small module with `shouldEmit(key): boolean` / `markEmitted(key)`
//   wrapping existing ref patterns (gas, indexer, receipt Set).
// - **MTX adapter:** `emitMtxNotification` reuses durations + dedupe shape but separate
//   `eventId` prefix to avoid collisions with `staking:` keys.

// =============================================================================
// 22. Intentionally unresolved (need product / chain forensics)
// =============================================================================
//
// - **Replaced / dropped txs:** whether staking should ever auto-toast vs only show in
//   on-chain history — depends on wallet signals and RPC consistency.
// - **Cancelled vs succeeded race:** if user dismisses then receipt succeeds, whether
//   to show success toast, reopen modal, or only refresh balances — **must** pick one
//   product rule before Phase 7.
// - **Double wrong-network** copy (vault vs indexer): which surface absorbs the other.
// - **MTX noop action button:** product decision (remove vs dismiss handler).

// =============================================================================
// 23. PHASE 4A — Canonical dedupe id shape (implemented in `stakingToast.ts`)
// =============================================================================
//
// **Pattern:** `staking:notif:<domain>:<event>` with optional extra segments from
// `createStakingToastDedupeKey(domain, event, ...fingerprint)`.
//
// - `domain` / `event` are sanitized to lowercase `[a-z0-9_]` (max 32 / 48 chars).
// - Arbitrary string fingerprints (e.g. raw indexer errors) use `stakingToastDedupeFingerprint`
//   so ids stay short and stable without embedding RPC blobs.
// - **Ref / Set dedupe remains authoritative** for spam prevention; Sonner `id` is additive.
//
// **Examples (non-exhaustive):**
// - `staking:notif:wallet:wrong_network`
// - `staking:notif:vault:rpc_meta`
// - `staking:notif:gas:near_zero_eth`
// - `staking:notif:gas:insufficient_native`
// - `staking:notif:referral:copy_fail`
// - `staking:notif:terms:storage_write`
// - `staking:notif:history:indexer:wrong_net:f<hash>` (fingerprint suffix)

// =============================================================================
// 24. PHASE 4B — Title / description rhythm (incremental)
// =============================================================================
//
// - **Titles:** short outcome or problem; **sentence case**; prefer **“Couldn’t”**
//   contraction family for system failures (matches indexer/affiliate copy).
// - **Descriptions:** one imperative or guidance sentence; end with a period; avoid
//   duplicating the title’s nouns unless disambiguation needs it.
// - **Wallet/network:** wrong-network toasts use the same network label + chain id
//   phrasing as indexer-side wrong-network summaries where possible (reduces “two
//   different wrong-network voices” until a single owner is chosen in §22).

// =============================================================================
// 25. PHASE 4C — Severity semantics (incremental)
// =============================================================================
//
// - **Gas / balance headroom:** `stakingToastWarning` (non-terminal, user may still act).
// - **Hard failures / misconfiguration:** `stakingToastError`.
// - **Success / info:** reserved for later phases; tx success remains modal-first (§10).

// =============================================================================
// 26. PHASE 4D — Helper adoption status (living document)
// =============================================================================
//
// | Category | Surfaces | Notes |
// |----------|----------|--------|
// | **Fully migrated** | `StakingAppReferral` (copy fail), `StakingTermsConsentProvider` (storage), `StakingAppErrorSurface` (indexer), `StakingAppTransactionHistory` (affiliate list), `useStakingGasToastDedupe`, `useStakingVault` (wrong network + RPC meta) | Use `stakingToast*` + canonical dedupe ids |
// | **Partially migrated** | _none_ | — |
// | **N/A / removed** | MTX ICO buy dialog (P4) | — |
// | **Tx-owned / high-risk** | `TransactionStatusProvider` receipt toasts, `StakingAppDepositForm` / `StakingAppWithdrawForm` dismiss-panel toasts | Phase 7+; do not adopt helpers without modal-awareness |
// | **Legacy raw Sonner** | High-risk tx paths above | Track until migrated |

// =============================================================================
// 27. PHASE 4E — MTX (historical)
// =============================================================================
//
// Prior MTX swap / ICO dialog copy lived in removed `icoBuyDialog` (P4). If MTX regains an
// in-app swap surface, re-open alignment with §17–§19 using shared `stakingToast*` helpers only.

// =============================================================================
// Optional: Phase 3 helper names (documentation only; no exports required yet)
// =============================================================================
//
// Implemented: `@/staking/ui` (`stakingToastSuccess|Error|Warning|Info`,
// `createStakingToastDedupeKey`, `stakingToastDedupeFingerprint`, `stakingToastDurationForSeverity`,
// `shouldEmitStakingToast`). Optional future: `showStakingToast` aggregate.

// =============================================================================
// 28. PHASE 5A — Positioning audit (code-based; screenshots = manual QA)
// =============================================================================
//
// **Host:** single `<Toaster />` in `App.tsx` → `@/components/ui/sonner` wraps Sonner.
//
// **Desktop (`>600px` viewport):**
// - `position`: **bottom-right** (default after Phase 5 responsive split).
// - `offset`: `--offset-bottom/right` from `STAKING_TOAST_DESKTOP_OFFSET` (20px).
//
// **Mobile (`max-width: 600px`, Sonner’s injected CSS):**
// - Toaster becomes full width with horizontal insets from **`mobileOffset`** vars
//   (`--mobile-offset-left/right/bottom`).
// - `position`: **bottom-center** (Phase 5) so stacks align with thumb reach vs corner.
// - Bottom inset: **`max(20px, env(safe-area-inset-bottom) + 88px)`** — lifts stacks
//   above typical home-indicator + bottom-sheet chrome (heuristic, not tx-state-aware).
//
// **Z-index:** Sonner ships `z-index: 999999999` on `[data-sonner-toaster]` — **above**
// staking tx overlay/content (`STAKING_MODAL_Z_INDEX` 61–62) and navbar, **below**
// `InitialSplashOverlay` (`z-[9999]`) only numerically false — Sonner is higher; splash is
// rare short-lived. **No z-index change in Phase 5** (would risk AppKit / modal wars).
//
// **Tx bottom sheet overlap:** staking tx `DialogContent` is bottom-anchored on `max-md`;
// toasts can still **visually overlap** sheet chrome if sheet is tall; Phase 5 reduces risk
// via **center + larger bottom offset**, not modal coupling (deferred if still insufficient).
//
// **Keyboard / visual viewport:** Sonner does not subscribe to `visualViewport`; keyboard
// open may shift content but toaster stays `fixed` to layout viewport — **acceptable**
// unless product adds `visualViewport` listeners later (§35).
//
// **AppKit / reown:** wallet modals sit in their own stacking contexts; toasts remain
// document-level. Risk: toast above wallet modal — same as pre-Phase-5 Sonner default.
//
// **Manual QA captures (not stored in-repo):** iPhone Safari, Android Chrome, small-height,
// tx sheet open, modal+toast, keyboard open — run before shipping Phase 5 to production.

// =============================================================================
// 29. PHASE 5B — Mobile toast philosophy (authoritative)
// =============================================================================
//
// 1. **Narrow viewport (`≤600px`):** **bottom-center** + symmetric horizontal inset +
//    **safe-area-aware** bottom lift (tokens).
// 2. **Desktop:** **bottom-right** + modest offset from edges.
// 3. **Thumb zone:** prefer vertical clearance over aggressive horizontal squeeze.
// 4. **Gestures:** Sonner swipe defaults remain; do not shrink hit targets in Phase 5.
// 5. **Tx coexistence:** ergonomic mitigation first (offset/center); **no** tx snapshot
//    wiring to toasts until a later phase explicitly approves it.

// =============================================================================
// 30. PHASE 5C — Safe-area / offset tokens (SSOT)
// =============================================================================
//
// All magic numbers for toast placement live in **`stakingNotificationLayout.ts`**:
// `STAKING_TOAST_VIEWPORT_MAX_PX`, `STAKING_TOAST_MEDIA_NARROW`,
// `STAKING_TOAST_MOBILE_SHEET_CLEARANCE_PX`, `STAKING_TOAST_MOBILE_HORIZONTAL_INSET_PX`,
// `STAKING_TOAST_DESKTOP_OFFSET`, `STAKING_TOAST_MOBILE_OFFSET`.

// =============================================================================
// 31. PHASE 5E — Tx sheet coexistence rules (policy; minimal runtime in Phase 5)
// =============================================================================
//
// - **Rule 1:** Tx modal/sheet owns focus and primary narrative; toasts are ephemeral and
//   may paint **above** sheets (Sonner z-index) — acceptable if unobstructed readability.
// - **Rule 2:** Mitigate overlap by **raising** toast stack (bottom offset) and **centering**
//   on narrow screens — **no** `TransactionStatusProvider` hooks in Phase 5.
// - **Rule 3 (future):** optional `data-staking-tx-sheet-open` + CSS margin — only if
//   heuristic offset proves insufficient after QA.

// =============================================================================
// 32. PHASE 5F — Keyboard + small-height review
// =============================================================================
//
// **Works today:** fixed toaster, reduced-motion respected by Sonner for toast motion.
// **Untouched:** no `visualViewport` resize orchestration; no dynamic `visibleToasts` tuning.
// **Residual risk:** landscape + keyboard may crowd bottom region — monitor in QA;
//   adjustment would be token tweak (`STAKING_TOAST_MOBILE_SHEET_CLEARANCE_PX`) first.

// =============================================================================
// 33. PHASE 5D — Implementation map (code)
// =============================================================================
//
// - `components/ui/sonner.tsx` — `useSyncExternalStore` + `STAKING_TOAST_MEDIA_NARROW`,
//   responsive `position`, default `offset` / `mobileOffset` from layout tokens; explicit
//   `position` / `offset` props still override when passed.
// - `App.tsx` — duplicate `position` removed; placement owned by wrapper defaults.

/** Bump when matrix, precedence, dedupe canon, adoption map, or layout tokens change materially. */
export const STAKING_NOTIFICATION_SPEC_VERSION = 5 as const
