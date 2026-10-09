/**
 * # Staking modal / dialog specification (single source of truth)
 *
 * **Phase 1:** canonical tokens + policies for incremental normalization (Phases
 * 2–8). New staking dialog work should import from here; legacy call sites are
 * migrated gradually.
 *
 * ## Non-goals
 *
 * - Does not replace Radix primitives, providers, or transaction state machines.
 * - Does not change runtime behavior until consumers adopt these exports.
 * - `InitialSplashOverlay` (`z-[9999]`) remains a **full-app bootstrap** layer,
 *   documented only for ordering awareness — not a staking dialog variant.
 *
 * ## Radix focus
 *
 * @see https://www.radix-ui.com/primitives/docs/components/dialog
 */

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Z-index ladder (10 — overlay + z-index normalization)
// ---------------------------------------------------------------------------

/**
 * Stacking order. Higher = closer to the user.
 * **Invariant:** `transaction*` must stay above `terms*` so in-flight tx UI is
 * never visually trapped under consent if both were present.
 */
export const STAKING_MODAL_Z_INDEX = {
  baseOverlay: 50,
  baseContent: 50,
  termsBackdrop: 59,
  termsContent: 60,
  transactionOverlay: 61,
  transactionContent: 62,
  bootstrapSplash: 9999,
} as const

export type StakingModalZIndexKey = keyof typeof STAKING_MODAL_Z_INDEX

/** Tailwind arbitrary z-index, e.g. `z-[61]`. */
export function stakingModalZIndexClass(key: StakingModalZIndexKey): string {
  return `z-[${STAKING_MODAL_Z_INDEX[key]}]`
}

// ---------------------------------------------------------------------------
// Overlay / backdrop philosophy (9)
// ---------------------------------------------------------------------------

/**
 * **Glass (base z)** — dim + blur at `z-50` for normal staking dialogs (referral /
 * Telegram target when not elevated).
 */
export const STAKING_MODAL_OVERLAY_GLASS_BASE = cn(
  stakingModalZIndexClass("baseOverlay"),
  "bg-black/45 backdrop-blur-sm supports-[backdrop-filter]:bg-black/35"
)

/**
 * **Glass (elevated)** — same treatment at transaction overlay height (`z-61`).
 */
export const STAKING_MODAL_OVERLAY_GLASS_ELEVATED = cn(
  stakingModalZIndexClass("transactionOverlay"),
  "bg-black/45 backdrop-blur-sm supports-[backdrop-filter]:bg-black/35"
)

/**
 * **Light glass** — slightly softer; legacy referral overlay target.
 */
export const STAKING_MODAL_OVERLAY_LIGHT = cn(
  stakingModalZIndexClass("baseOverlay"),
  "bg-black/40 backdrop-blur-sm supports-[backdrop-filter]:bg-black/38 backdrop-saturate-100"
)

/**
 * **Terms consent** — intentional exception: fade-only dim, **no** blur, used
 * with `modal={false}` + custom portal. Do not swap blindly for `OVERLAY_GLASS`.
 */
export const STAKING_MODAL_OVERLAY_TERMS_DIM = cn(
  stakingModalZIndexClass("termsBackdrop"),
  "animate-in fade-in-0 fixed inset-0 bg-black/50 duration-200"
)

// ---------------------------------------------------------------------------
// Radius system (1) + sheet top radius (2)
// ---------------------------------------------------------------------------

/**
 * **Desktop / centered card** outer shell (pairs with glass panel tokens from
 * `stakingGlassPanel.ts`). Prefer `STAKING_BALANCE_LIQUID_CARD` / column shell on content.
 */
export const STAKING_MODAL_RADIUS_DESKTOP_CARD = "sm:rounded-3xl" as const

/**
 * **Mobile bottom sheet** top corners — single canonical curve for staking sheets
 * (Phase 5 migrates `rounded-t-4xl` / `rounded-t-2xl` drift to this).
 */
export const STAKING_MODAL_RADIUS_SHEET_TOP = "max-md:rounded-t-[22px]" as const

/**
 * **Sheet bottom** — flush to viewport bottom.
 */
export const STAKING_MODAL_RADIUS_SHEET_BOTTOM = "max-md:rounded-b-none max-md:border-b-0" as const

/**
 * **Nested body card** inside transaction dialog (inner timeline / preview).
 */
export const STAKING_MODAL_RADIUS_INNER_CARD = "rounded-3xl" as const

/**
 * **Drag handle pill** (purely decorative).
 */
export const STAKING_MODAL_SHEET_HANDLE =
  "pointer-events-none flex justify-center pt-2.5 pb-0.5 max-md:flex md:hidden" as const

/** Handle row without breakpoint visibility — Telegram / referral legacy */
export const STAKING_MODAL_SHEET_HANDLE_STRIP_ROW =
  "pointer-events-none flex justify-center pt-2.5 pb-0.5" as const

export const STAKING_MODAL_SHEET_HANDLE_BAR =
  "h-[5px] w-9 shrink-0 rounded-full bg-black/[0.14]" as const

/** Alternate handle (softer, tx-style) — migrate to `SHEET_HANDLE_BAR` in Phase 5 */
export const STAKING_MODAL_SHEET_HANDLE_BAR_ALT =
  "h-1.5 w-9 shrink-0 rounded-full bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" as const

// ---------------------------------------------------------------------------
// Spacing scale (3) + header (4) + footer (5)
// ---------------------------------------------------------------------------

/** Outer content padding (sheet / centered body). */
export const STAKING_MODAL_PADDING_CONTENT = "px-5 pb-4 pt-2 sm:px-6 sm:pb-5" as const

/** Transaction dialog body padding (denser). */
export const STAKING_MODAL_PADDING_CONTENT_DENSE = "px-4 pt-2 pb-4 sm:px-5 sm:pt-3 sm:pb-5" as const

/** Header block spacing under handle. */
export const STAKING_MODAL_SPACING_HEADER_TIGHT = "space-y-1.5" as const
export const STAKING_MODAL_SPACING_HEADER = "space-y-3" as const

/** Title → body separation */
export const STAKING_MODAL_SPACING_TITLE_BODY = "mb-4" as const

/** Footer vertical rhythm */
export const STAKING_MODAL_FOOTER_GAP = "gap-3" as const

/** Safe area — canonical bottom padding inside sheet shells */
export const STAKING_MODAL_SAFE_AREA_BOTTOM =
  "pb-[max(1rem,env(safe-area-inset-bottom))]" as const

/** Transaction variant (tighter floor) — converge in Phase 5 if product agrees */
export const STAKING_MODAL_SAFE_AREA_BOTTOM_COMPACT =
  "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]" as const

// ---------------------------------------------------------------------------
// Button layout philosophy (6) + footer structure (6)
// ---------------------------------------------------------------------------

/**
 * **Philosophy**
 *
 * 1. **Primary** = main forward action (Confirm, Accept, Done, OK).
 * 2. **Secondary** = dismiss / safe exit (Cancel, Close outline).
 * 3. **Destructive** = irreversible (Remove); never the only focusable without confirm.
 * 4. **Mobile thumb zone:** primary closest to bottom **unless** a destructive
 *    confirm intentionally inverts (use explicit layout + copy, not ad-hoc margins).
 * 5. **DOM order for `flex-col-reverse`:** secondary first, primary last — primary
 *    renders visually nearer bottom on mobile for bottom sheets.
 */
export const STAKING_MODAL_FOOTER_ROW = cn(
  "flex w-full flex-col-reverse",
  STAKING_MODAL_FOOTER_GAP,
  "sm:flex-row sm:justify-end sm:gap-3"
)

/** Vertical stack without reverse (secondary on top). */
export const STAKING_MODAL_FOOTER_COL = cn(
  "flex w-full flex-col",
  STAKING_MODAL_FOOTER_GAP,
  "sm:flex-row sm:justify-end sm:gap-3"
)

// ---------------------------------------------------------------------------
// Mobile sheet behavior (7)
// ---------------------------------------------------------------------------

/** Shared max-height presets (pick per surface; document choice in component). */
/** Tall sheet cap below `sm` — referral manage outer shell */
export const STAKING_MODAL_SHEET_MAX_HEIGHT_TALL_MAX_SM =
  "max-sm:max-h-[min(88dvh,720px)]" as const

/** Scrollport max height for tall manage bodies (matches referral manage inner). */
export const STAKING_MODAL_SCROLL_BODY_MAX_TALL = "max-h-[min(88dvh,720px)]" as const

export const STAKING_MODAL_SHEET_MAX_HEIGHT = {
  /** Default tall manage / scrollable content */
  tall: "max-h-[min(88dvh,720px)] max-md:max-h-[min(88dvh,720px)]",
  /** Transaction / dense flows */
  standard: "max-h-[min(90dvh,640px)] max-md:max-h-[90dvh]",
  /** Terms / long copy */
  copyHeavy: "max-md:max-h-[90dvh]",
} as const

export const STAKING_MODAL_SHEET_INSET_MOBILE = cn(
  "max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:w-full",
  "max-md:translate-x-0 max-md:translate-y-0"
)

export const STAKING_MODAL_SHEET_SLIDE_ANIM =
  "max-md:data-[state=open]:slide-in-from-bottom-2 max-md:data-[state=closed]:slide-out-to-bottom" as const

/** Standard open/close duration (ms via Tailwind) */
export const STAKING_MODAL_MOTION_DURATION = "duration-200" as const
export const STAKING_MODAL_MOTION_DURATION_SHEET = "duration-300" as const

// ---------------------------------------------------------------------------
// Close button (8) — sizing / focus / touch target (visuals implemented Phase 3)
// ---------------------------------------------------------------------------

/**
 * **Shared dismiss philosophy**
 *
 * - **Touch target:** min 40×40px (`size-10` on mobile); `sm:size-7` optional shrink
 *   on desktop only if paired with larger hit-area padding (Phase 3 implements once).
 * - **Position:** `absolute top-3 right-3` (`sm:top-3.5 sm:right-3.5`).
 * - **Focus:** visible ring per design system; never default initial focus (see focus policy).
 *
 * Export token fragments for composition; full class string lives in Phase 3 helper.
 */
export const STAKING_MODAL_DISMISS_POSITION = "absolute top-3 right-3 z-20 sm:top-3.5 sm:right-3.5" as const
export const STAKING_MODAL_DISMISS_HIT_AREA = "flex size-10 shrink-0 items-center justify-center sm:size-7" as const

/**
 * Corner dismiss control — **visual parity** with built-in `DialogContent` close in
 * `dialog.tsx`. Staking modals use this; global dialog default unchanged (Phase 2).
 */
export const STAKING_MODAL_DISMISS_BUTTON_CLASS = cn(
  STAKING_MODAL_DISMISS_POSITION,
  STAKING_MODAL_DISMISS_HIT_AREA,
  "cursor-pointer rounded-full",
  "hover:bg-white/32 hover:border-white/70 active:scale-[0.94]",
  "border border-white/55 bg-white/22 text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_4px_16px_-6px_rgba(0,0,0,0.18)]",
  "backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-white/18",
  "transition-[transform,background-color,box-shadow,border-color] duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
  "disabled:pointer-events-none",
  "dark:border-white/20 dark:bg-white/12 dark:text-neutral-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_20px_-8px_rgba(0,0,0,0.45)] dark:hover:bg-white/18",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[18px] [&_svg]:stroke-[2.25] sm:[&_svg]:size-[15px]"
)

// ---------------------------------------------------------------------------
// Sheet geometry — `max-sm` variant (Telegram + referral legacy breakpoint)
// ---------------------------------------------------------------------------

/** Inset + full-width bottom sheet below `sm` (640px) — legacy staking dialogs */
export const STAKING_MODAL_SHEET_INSET_MAX_SM = cn(
  "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-w-none max-sm:w-full",
  "max-sm:translate-x-0 max-sm:translate-y-0"
)

export const STAKING_MODAL_RADIUS_SHEET_TOP_MAX_SM = "max-sm:rounded-t-[22px]" as const

export const STAKING_MODAL_RADIUS_SHEET_BOTTOM_MAX_SM =
  "max-sm:rounded-b-none max-sm:border-b-0" as const

export const STAKING_MODAL_SHEET_SLIDE_ANIM_MAX_SM =
  "max-sm:data-[state=open]:slide-in-from-bottom-2 max-sm:data-[state=closed]:slide-out-to-bottom" as const

// ---------------------------------------------------------------------------
// Shadow / elevation (9) — dialog chrome above glass inner cards
// ---------------------------------------------------------------------------

/** Elevated sheet shadow (referral / Telegram family) */
export const STAKING_MODAL_ELEVATION_SHEET =
  "shadow-[0_22px_72px_-14px_rgba(0,0,0,0.16)]" as const

// ---------------------------------------------------------------------------
// Width philosophy
// ---------------------------------------------------------------------------

export const STAKING_MODAL_WIDTH_SHEET_SM = "sm:max-w-[min(100%,400px)]" as const
export const STAKING_MODAL_WIDTH_SHEET_SM_NARROW = "sm:max-w-[min(100%,380px)]" as const
export const STAKING_MODAL_WIDTH_TX = "sm:max-w-md" as const

/** Centered card placement from `sm` breakpoint up */
export const STAKING_MODAL_SHEET_DESKTOP_PLACEMENT =
  "sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]" as const

// ---------------------------------------------------------------------------
// Typography hierarchy (Phase 7 — tokens only here)
// ---------------------------------------------------------------------------

/** iOS-like sheet title (referral / Telegram baseline) */
export const STAKING_MODAL_TYPE_SHEET_TITLE =
  "text-center text-[17px] font-semibold leading-snug tracking-[-0.02em] text-neutral-900" as const

/** iOS-like sheet description */
export const STAKING_MODAL_TYPE_SHEET_DESCRIPTION =
  "text-center text-[13px] leading-[1.45] text-neutral-500 [text-wrap:balance]" as const

/** Terms / legal title (larger, left-aligned) */
export const STAKING_MODAL_TYPE_LEGAL_TITLE =
  "text-xl font-semibold leading-snug tracking-tight text-foreground" as const

/** Transaction dialog title */
export const STAKING_MODAL_TYPE_TX_TITLE =
  "text-start text-lg font-semibold text-foreground" as const

/** Icon beside modal/sheet title — single size, muted ink (all staking surfaces). */
export const STAKING_MODAL_TITLE_ICON_CLASS = cn(
  "size-5 shrink-0 text-neutral-500 dark:text-neutral-400",
)

// ---------------------------------------------------------------------------
// Focus policy types (10) — implement `onOpenAutoFocus` in Phase 4
// ---------------------------------------------------------------------------

export type StakingModalFocusPolicy = "contentRoot" | "primaryCta" | "firstFocusable"

export const STAKING_MODAL_FOCUS_POLICY_BY_CATEGORY = {
  transactionLifecycle: "contentRoot" satisfies StakingModalFocusPolicy,
  termsConsent: "primaryCta" satisfies StakingModalFocusPolicy,
  referralNotice: "primaryCta" satisfies StakingModalFocusPolicy,
  referralManage: "contentRoot" satisfies StakingModalFocusPolicy,
  telegramUnsupported: "primaryCta" satisfies StakingModalFocusPolicy,
} as const

/** Close / dismiss must not receive initial focus when avoidable */
export const STAKING_MODAL_FOCUS_INVARIANT_CLOSE_NOT_INITIAL = true as const
