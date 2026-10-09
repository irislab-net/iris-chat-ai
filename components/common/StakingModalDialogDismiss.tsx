import { DialogClose } from "@/components/ui/staking-dialog"
import { STAKING_MODAL_DISMISS_BUTTON_CLASS } from "@/constants/stakingModalSpec"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
import type { ComponentProps } from "react"

export type StakingModalDialogDismissProps = Omit<
  ComponentProps<typeof DialogClose>,
  "children"
> & {
  /** Override icon/label; default matches shared `DialogContent` close. */
  children?: React.ReactNode
}

/**
 * Staking modal corner dismiss — **visual only** (Radix `DialogClose` semantics unchanged).
 */
export function StakingModalDialogDismiss({
  className,
  children,
  ...props
}: StakingModalDialogDismissProps) {
  return (
    <DialogClose
      type='button'
      className={cn(STAKING_MODAL_DISMISS_BUTTON_CLASS, className)}
      {...props}
    >
      {children ?? (
        <>
          <XIcon />
          <span className='sr-only'>Close</span>
        </>
      )}
    </DialogClose>
  )
}
