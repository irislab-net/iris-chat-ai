import { cn } from "@/lib/utils"

/**
 * Visual-only class names for staking amount sliders (deposit / withdraw).
 * Liquid-glass rail + blue tint fill — aligned with Exur accent.
 *
 * Note: avoid `transform: scale()` on the thumb — Radix positions it with inline
 * `transform`, which would override class-based scaling. Depth uses shadow + filter.
 */
export const STAKING_AMOUNT_SLIDER_ROOT_CLASSNAME = cn(
  "isolate py-1.5 motion-reduce:transition-none"
)

/** Inactive rail: frosted glass track */
export const STAKING_AMOUNT_SLIDER_TRACK_CLASSNAME = cn(
  "border border-white/55",
  "shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]",
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.42)_45%,rgba(235,240,250,0.85)_100%)]",
  "backdrop-blur-sm",
  "data-[orientation=horizontal]:h-2.5 sm:data-[orientation=horizontal]:h-2.5",
  "dark:border-white/16 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_100%)]"
)

/** Active fill — liquid blue tint */
export const STAKING_AMOUNT_SLIDER_RANGE_CLASSNAME = cn(
  "rounded-full",
  "origin-center scale-y-[1.14] will-change-transform",
  "bg-[linear-gradient(180deg,rgba(147,197,253,0.95)_0%,rgba(37,99,235,0.92)_42%,rgba(29,78,216,0.98)_100%)]",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(29,78,216,0.35),0_0_0_1px_rgba(255,255,255,0.18),0_2px_8px_-2px_rgba(37,99,235,0.4)]"
)

/**
 * Liquid blue glass knob with specular pearl.
 * Avoid scale() — Radix uses inline transform.
 */
export const STAKING_AMOUNT_SLIDER_THUMB_CLASSNAME = cn(
  "relative z-10 size-[22px] shrink-0 rounded-full",
  "cursor-grab active:cursor-grabbing",
  "border border-white/70",
  "bg-[radial-gradient(ellipse_92%_86%_at_50%_22%,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.35)_28%,transparent_52%),linear-gradient(160deg,#93C5FD_0%,#2563EB_48%,#1D4ED8_100%)]",
  "shadow-[0_0_0_0.5px_rgba(255,255,255,0.35),inset_0_1px_2px_rgba(255,255,255,0.65),inset_0_-2px_4px_rgba(29,78,216,0.35),0_2px_8px_-2px_rgba(37,99,235,0.45)]",
  "outline-none ring-0 ring-offset-0 hover:ring-0 hover:ring-offset-0",
  "before:pointer-events-none before:absolute before:inset-0 before:m-auto before:size-[7px] before:rounded-full",
  "before:bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#E0EFFF_70%,#BFDBFE_100%)]",
  "before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_0_4px_-1px_rgba(37,99,235,0.25)]",
  "before:content-['']",
  "transition-[box-shadow,filter] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
  "hover:brightness-[1.04]",
  "focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-0",
  "active:brightness-[0.97]",
  "disabled:cursor-not-allowed disabled:brightness-100",
  "motion-reduce:transition-none motion-reduce:hover:brightness-100 motion-reduce:active:brightness-100"
)
