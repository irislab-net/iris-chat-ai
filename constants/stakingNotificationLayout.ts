/**
 * Staking notification **layout** tokens (Phase 5) — placement, offsets, safe-area.
 * Policy narrative: `stakingNotificationSpec.ts` §28+.
 *
 * Sonner injects `@media (max-width: 600px)` for mobile toaster geometry; keep
 * `STAKING_TOAST_VIEWPORT_MAX_PX` aligned with that breakpoint when choosing
 * `matchMedia` for responsive `position`.
 */

import type { ToasterProps } from "sonner"

/** Must stay aligned with Sonner’s internal mobile toaster `@media (max-width: …)`. */
export const STAKING_TOAST_VIEWPORT_MAX_PX = 600 as const

/** `matchMedia` query for narrow viewport (toaster + position split). */
export const STAKING_TOAST_MEDIA_NARROW = `(max-width: ${STAKING_TOAST_VIEWPORT_MAX_PX}px)` as const

/**
 * Extra bottom lift above the home indicator + typical staking bottom-sheet thumb
 * zone (heuristic; not tied to tx state — see spec §31 coexistence).
 */
export const STAKING_TOAST_MOBILE_SHEET_CLEARANCE_PX = 88 as const

/** Fixed navbar inner row height (matches `navbar.tsx` link `h-[56px]`). */
export const STAKING_NAVBAR_HEIGHT_PX = 56 as const

/** Gap between navbar bottom and top-stacked transaction progress toasts. */
export const STAKING_TOAST_BELOW_NAVBAR_GAP_PX = 8 as const

/** Desktop navbar wrapper top padding (`md:pt-6`). */
export const STAKING_NAVBAR_DESKTOP_TOP_PADDING_PX = 24 as const

/** Horizontal inset for full-width mobile toasts (px). */
export const STAKING_TOAST_MOBILE_HORIZONTAL_INSET_PX = 16 as const

/** Desktop / `>600px` — `offset` CSS vars (`--offset-*`). */
export const STAKING_TOAST_DESKTOP_OFFSET = {
  bottom: 20,
  right: 20,
} satisfies NonNullable<ToasterProps["offset"]> &
  Record<"bottom" | "right", number>

/**
 * Narrow viewport — `mobileOffset` CSS vars (`--mobile-offset-*`).
 * Bottom uses safe-area + sheet clearance so stacks sit above iOS home bar
 * and reduce overlap with bottom-anchored staking sheets.
 */
export const STAKING_TOAST_MOBILE_OFFSET = {
  top: `calc(env(safe-area-inset-top, 0px) + ${STAKING_NAVBAR_HEIGHT_PX}px + ${STAKING_TOAST_BELOW_NAVBAR_GAP_PX}px)`,
  left: STAKING_TOAST_MOBILE_HORIZONTAL_INSET_PX,
  right: STAKING_TOAST_MOBILE_HORIZONTAL_INSET_PX,
} satisfies NonNullable<ToasterProps["mobileOffset"]> &
  Record<"top" | "left" | "right", string | number>

/** Top offset for desktop top-center lifecycle toasts (below fixed navbar). */
export const STAKING_TOAST_DESKTOP_TOP_OFFSET = `calc(env(safe-area-inset-top, 0px) + ${STAKING_NAVBAR_DESKTOP_TOP_PADDING_PX}px + ${STAKING_NAVBAR_HEIGHT_PX}px + ${STAKING_TOAST_BELOW_NAVBAR_GAP_PX}px)` as const
