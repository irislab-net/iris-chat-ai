import {
  chatMobileComposerGlassClass,
  chatMobileComposerGlassFocusClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

/**
 * Amount field outer shell — same liquid glass as the chat composer pill frost.
 * Put Max / adornments inside; keep the `<Input>` transparent.
 */
export const STAKING_AMOUNT_FIELD_SHELL = cn(
  chatMobileComposerGlassClass,
  chatMobileComposerGlassFocusClass,
  "rounded-[22px] transition-[box-shadow,background-color,border-color] duration-200"
)

/** Transparent input sitting inside `STAKING_AMOUNT_FIELD_SHELL`. */
export const STAKING_AMOUNT_FIELD_INPUT = cn(
  "relative z-10 h-12 min-h-12 w-full min-w-0 rounded-[inherit] border-0 bg-transparent px-3.5 py-0 shadow-none",
  "text-base text-foreground",
  "placeholder:text-[13px] placeholder:leading-snug placeholder:text-muted-foreground/75 sm:placeholder:text-sm",
  "sm:h-11 sm:min-h-11 sm:px-3.5 sm:text-sm",
  "outline-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
  "disabled:bg-transparent disabled:opacity-60 dark:bg-transparent dark:disabled:bg-transparent"
)

/**
 * Shared staking field chrome for select triggers and similar controls.
 * Same composer frost as the amount shell (single surface, not nested glass-on-glass).
 * Body text uses `text-base` (16px) below `sm` so iOS Safari does not auto-zoom on focus.
 */
export const STAKING_INPUT_BASE = cn(
  chatMobileComposerGlassClass,
  "w-full min-w-0 py-0",
  "h-12 min-h-12 rounded-[22px] px-3.5",
  "text-base text-foreground",
  "placeholder:text-[13px] placeholder:leading-snug placeholder:text-muted-foreground/75 sm:placeholder:text-sm",
  "sm:h-11 sm:min-h-11 sm:px-3.5 sm:text-sm",
  "outline-none transition-[border-color,box-shadow,background-color] duration-200",
  "focus-visible:border-white/50 focus-visible:bg-white/36 focus-visible:ring-0 focus-visible:ring-offset-0",
  "supports-[backdrop-filter]:focus-visible:bg-white/22"
)

export const STAKING_INPUT_NORMAL = cn(
  "border-white/35",
  "focus-visible:border-white/50"
)

/** Passive (view-only) runtime: readable field, no edit affordance. */
export const STAKING_INPUT_VIEW_ONLY = cn(
  "cursor-default border-white/25 bg-white/14 text-muted-foreground",
  "focus-visible:border-white/25 focus-visible:ring-0",
  "dark:bg-white/8"
)

export const STAKING_INPUT_ERROR = cn(
  "border-red-400/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_0_0_1px_rgba(239,68,68,0.25),0_-6px_20px_-6px_rgba(239,68,68,0.12)]",
  "focus-visible:border-red-400/80 focus-visible:ring-0"
)

/** Outer search bar shell — composer frost; expand/collapse via companion classes. */
export const STAKING_SEARCH_SHELL = cn(
  chatMobileComposerGlassClass,
  chatMobileComposerGlassFocusClass,
  "flex min-w-0 shrink-0 items-center rounded-[18px]",
  "h-11 min-h-11"
)

/** Collapsed search = square glass icon control (matches refresh). */
export const STAKING_SEARCH_SHELL_COLLAPSED = cn(
  "w-11 max-w-11 cursor-pointer",
  "hover:border-white/50 hover:bg-white/32",
  "dark:hover:border-white/24 dark:hover:bg-white/18"
)

export const STAKING_SEARCH_SHELL_EXPANDED = cn(
  "w-full max-w-full cursor-text",
  "sm:max-w-[min(22rem,calc(100vw-5rem))]"
)

/** Active query while collapsed — denser frost, still glass (not opaque white). */
export const STAKING_SEARCH_SHELL_QUERY_HINT = cn(
  "border-white/55 bg-white/36",
  "supports-[backdrop-filter]:bg-white/22",
  "dark:border-white/24 dark:bg-white/18"
)

/** Icon buttons in activity toolbar (refresh). */
export const STAKING_TOOLBAR_ICON_BUTTON = cn(
  chatMobileComposerGlassClass,
  "size-11 shrink-0 rounded-[18px] text-muted-foreground",
  "hover:border-white/50 hover:bg-white/32 hover:text-foreground",
  "dark:hover:border-white/24 dark:hover:bg-white/18 dark:hover:text-foreground",
  "disabled:opacity-50"
)

/** Referrer paste area: borderless inner fill inside liquid card; keeps action-button inset padding. */
export const STAKING_TEXTAREA = cn(
  "w-full min-w-0 cursor-pointer resize-y rounded-xl border-0 border-transparent bg-transparent",
  "min-h-[64px] py-2 pb-9 ps-3.5 pe-3.5 sm:min-h-[76px] sm:py-2.5 sm:pb-10 sm:ps-4 sm:pe-4",
  "font-mono text-[15px] leading-snug text-foreground sm:text-sm",
  "placeholder:text-[13px] placeholder:text-muted-foreground/80 sm:placeholder:text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/22 focus-visible:ring-offset-0",
  "pointer-coarse:text-[16px]"
)

export const STAKING_SELECT_TRIGGER = cn(
  STAKING_INPUT_BASE,
  STAKING_INPUT_NORMAL,
  "flex w-full items-center justify-between gap-2 whitespace-nowrap",
  "data-[placeholder]:text-muted-foreground/80",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  "data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:border-white/50 data-[state=open]:bg-white/36"
)
