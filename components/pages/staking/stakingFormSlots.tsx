import {
  STAKING_FORM_V_FEE_TO_STATUS,
  STAKING_FORM_V_SLIDER_STACK,
} from "@/components/pages/staking/StakingFormLayout"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * Slot stack: vertical rhythm only (`StakingFormLayout` outer body is the same natural
 * flex column — no nested flex-fill, scroll, or shrink contracts).
 */
export const STAKING_FORM_SLOT_BODY_CLASS = "flex min-w-0 flex-col px-1"

/** Primary staking CTA — Exur blue liquid tint (matches chat landing accent). */
export const STAKING_PRIMARY_CTA_BUTTON_CLASS = cn(
  "w-full min-w-[200px] justify-center rounded-full border-0 bg-[#2563EB]/88 text-base font-semibold leading-tight tracking-tight text-white antialiased",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),inset_0_-1px_2px_rgba(29,78,216,0.28),0_4px_16px_-4px_rgba(37,99,235,0.28)]",
  "hover:bg-[#2563EB]/96 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(29,78,216,0.32),0_6px_20px_-4px_rgba(37,99,235,0.36)]",
  "disabled:opacity-70",
  "h-12 min-h-12 max-h-12 px-6 py-0 motion-safe:transition-[transform,opacity,background-color,box-shadow] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96] motion-reduce:transition-none",
  "sm:h-10 sm:min-h-10 sm:max-h-10 sm:text-sm",
  "tabular-nums"
)

/** Passive (view-only) runtime: disabled without looking broken or “loading”. */
export const STAKING_PASSIVE_PRIMARY_CTA_BUTTON_CLASS = cn(
  STAKING_PRIMARY_CTA_BUTTON_CLASS,
  "disabled:cursor-default disabled:bg-[#2563EB]/45 disabled:text-white/90 disabled:opacity-100 hover:disabled:bg-[#2563EB]/45"
)

export function StakingFormSlotAsset({ children }: { children: ReactNode }) {
  return <div className='shrink-0 min-w-0 pb-3'>{children}</div>
}

/** Amount context (available / withdrawable / constraints): fixed min-height, no branch mt-* */
export function StakingFormSlotMeta({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-5 min-w-0 shrink-0 flex-col justify-center pb-1 hidden!'>
      {children}
    </div>
  )
}

export function StakingFormSlotAmount({ children }: { children: ReactNode }) {
  return <div className='shrink-0 min-w-0 pb-5'>{children}</div>
}

export function StakingFormSlotSlider({
  children,
  className,
  ...rest
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("min-w-0 shrink-0 px-1 pb-2", className)}
      {...rest}
    >
      {children}
    </section>
  )
}

export function StakingFormSlotSliderInner({ children }: { children: ReactNode }) {
  return <div className={STAKING_FORM_V_SLIDER_STACK}>{children}</div>
}

export const STAKING_FORM_SLIDER_LABEL_ROW_CLASS =
  "flex justify-between text-xs font-mono font-medium text-muted-foreground"

/** Network + protocol fee rows + tight vertical gap */
export function StakingFormSlotFeeRows({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-col px-1",
        STAKING_FORM_V_FEE_TO_STATUS
      )}
    >
      {children}
    </div>
  )
}
