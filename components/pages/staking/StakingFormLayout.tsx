import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * Staking deposit/withdraw: natural-height column — no viewport-style flex-fill,
 * no internal scroll, no `mt-auto` footer pinning. Body then footer in stable block order.
 */
export const STAKING_FORM_ROOT_CLASS = "flex min-w-0 flex-col"

export const STAKING_FORM_BODY_CLASS = "flex min-w-0 flex-col"

/**
 * Vertical rhythm (exchange-style): use flex `gap` / footer `pt` — avoid adjacent margins
 * that collapse unpredictably.
 */
/** Amount input block → slider block */
export const STAKING_FORM_V_INPUT_TO_SLIDER = "mt-5"
/** Slider control → Min/Max labels (small) */
export const STAKING_FORM_V_SLIDER_STACK =
  "chat-ios26-liquid-glass relative isolate mb-2 flex flex-col gap-1.5 overflow-hidden rounded-[18px] border border-white/45 bg-white/40 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_4px_14px_-10px_rgba(15,23,42,0.08)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/30 dark:border-white/12 dark:bg-white/6"
/** Min/Max row → dedicated fee / meta section (medium) */
export const STAKING_FORM_V_SLIDER_TO_FEE = "mt-2"
/** Fee / meta block → primary CTA footer */
export const STAKING_FORM_FOOTER_CLASS =
  "flex w-full min-w-0 shrink-0 flex-col px-1 pt-2"
/** Tight stack: network/protocol fee row + CTA reason */
export const STAKING_FORM_V_FEE_TO_STATUS = "gap-0.5"

export type StakingFormLayoutProps = {
  body: ReactNode
  footer: ReactNode
  className?: string
}

export function StakingFormLayout({
  body,
  footer,
  className,
}: StakingFormLayoutProps) {
  return (
    <div className={cn(STAKING_FORM_ROOT_CLASS, className)}>
      <div className={STAKING_FORM_BODY_CLASS}>{body}</div>
      <div className={STAKING_FORM_FOOTER_CLASS}>{footer}</div>
    </div>
  )
}
