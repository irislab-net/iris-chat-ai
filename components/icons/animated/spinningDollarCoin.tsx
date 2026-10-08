import type { AnimationHandle } from "@/types/animation"
import { DollarSignIcon } from "lucide-react"
import React from "react"
import { SpinningCoin } from "./spinningCoin"
import { cn } from "@/lib/utils"

export const SpinningDollarCoin = React.forwardRef<
  AnimationHandle,
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => {
  return (
    <SpinningCoin
      ref={ref}
      className={cn(className)}
      faceClassName='p-[3px]'
      {...props}
    >
      <DollarSignIcon />
    </SpinningCoin>
  )
})
