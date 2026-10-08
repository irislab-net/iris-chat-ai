/**
 * Exur-aligned liquid glass for staking surfaces.
 * Matches chat iOS-26 frost + soft blue lift (see chat-mobile-gemini-styles).
 */

/** Outer shell: continuous corners + clip for backdrop-blur. */
export const STAKING_GLASS_SHELL =
  "chat-ios26-liquid-glass relative isolate overflow-hidden rounded-[28px]" as const

const STAKING_GLASS_SURFACE =
  "border border-white/35 bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.78),inset_0_0_0_0.5px_rgba(255,255,255,0.35),inset_0_-10px_18px_-12px_rgba(0,0,0,0.08),0_1px_2px_rgba(15,23,42,0.04),0_-6px_20px_-8px_rgba(37,99,235,0.10),0_10px_28px_-14px_rgba(15,23,42,0.12)] backdrop-blur-[22px] backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/40 dark:border-white/14 dark:bg-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.1),inset_0_-12px_22px_-12px_rgba(0,0,0,0.45),0_8px_28px_-12px_rgba(0,0,0,0.4),0_-8px_24px_-8px_rgba(37,99,235,0.14)] dark:supports-[backdrop-filter]:bg-white/7" as const

/** Full frosted panel. */
export const STAKING_GLASS_PANEL =
  `${STAKING_GLASS_SHELL} ${STAKING_GLASS_SURFACE}` as const

/** Nested cards / surfaces inside glass (~20px). */
export const STAKING_GLASS_INNER = "rounded-[20px]" as const

/** Inputs, asset row, compact controls (~18px). */
export const STAKING_GLASS_CONTROL = "rounded-[18px]" as const

/** Stake/Unstake column — slightly denser frost so the form reads as primary. */
export const STAKING_FORM_LIQUID_PANEL =
  `${STAKING_GLASS_SHELL} border border-white/40 bg-white/62 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.88),inset_0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_-8px_16px_-12px_rgba(0,0,0,0.08),0_1px_2px_rgba(15,23,42,0.03),0_-8px_24px_-8px_rgba(37,99,235,0.14),0_12px_32px_-14px_rgba(15,23,42,0.12)] backdrop-blur-[24px] backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/48 dark:border-white/16 dark:bg-white/12 dark:supports-[backdrop-filter]:bg-white/8` as const

/** Segmented control track. */
export const STAKING_SEGMENT_LIQUID_TRACK =
  "rounded-full border border-white/45 bg-white/25 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(0,0,0,0.05),0_1px_4px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-white/12 dark:bg-white/8" as const

export const STAKING_SEGMENT_LIQUID_BASE =
  "flex-1 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-[background,box-shadow,color,transform,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" as const

/** Active tab — soft blue selection bowl. */
export const STAKING_SEGMENT_LIQUID_ACTIVE =
  "border border-white/70 bg-[radial-gradient(circle_at_50%_38%,rgba(37,99,235,0.14)_0%,rgba(255,255,255,0.92)_48%,rgba(255,255,255,0.98)_100%)] text-foreground shadow-[0_2px_10px_-3px_rgba(37,99,235,0.18),inset_0_1px_1px_rgba(255,255,255,0.98)] dark:border-white/20 dark:bg-[radial-gradient(circle_at_50%_38%,rgba(37,99,235,0.28)_0%,rgba(30,30,35,0.9)_55%,rgba(24,24,28,0.95)_100%)] dark:text-foreground" as const

export const STAKING_SEGMENT_LIQUID_IDLE =
  "border border-transparent text-muted-foreground shadow-none hover:bg-white/30 hover:text-foreground dark:hover:bg-white/10" as const

export const STAKING_SOFT_LIQUID_SHADOW =
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.72),0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.1),0_-4px_16px_-8px_rgba(37,99,235,0.08)]" as const

/** Balance / referral nested cards. */
export const STAKING_BALANCE_LIQUID_CARD =
  `${STAKING_GLASS_INNER} border border-white/50 bg-white/50 ${STAKING_SOFT_LIQUID_SHADOW} backdrop-blur-md supports-[backdrop-filter]:bg-white/35 dark:border-white/12 dark:bg-white/8 dark:supports-[backdrop-filter]:bg-white/6` as const

/** Amount + slider well. */
export const STAKING_FORM_INPUT_WELL =
  `${STAKING_GLASS_INNER} border border-white/45 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_16px_-10px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6` as const

/** Fee + CTA stack. */
export const STAKING_FORM_ACTION_WELL =
  `${STAKING_GLASS_INNER} border border-white/40 bg-white/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_-8px_rgba(37,99,235,0.08)] dark:border-white/10 dark:bg-white/5` as const

/** Left column shell (balance + activity). */
export const STAKING_COLUMN_LIQUID_PANEL =
  `${STAKING_GLASS_SHELL} ${STAKING_GLASS_SURFACE}` as const
