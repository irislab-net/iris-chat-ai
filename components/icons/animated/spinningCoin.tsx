import useIconAnimation from "@/hooks/useIconAnimation"
import { cn } from "@/lib/utils"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

interface SpinningCoinProps
  extends React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> {
  faceClassName?: string
  sideClassName?: string
  sideSize?: number
}

export const SpinningCoin = React.forwardRef<
  AnimationHandle,
  SpinningCoinProps
>(
  (
    {
      className,
      children,
      faceClassName,
      sideClassName,
      sideSize = 4,
      ...props
    },
    ref
  ) => {
    const coinRef = useRef<HTMLDivElement>(null)

    const { containerRef } = useIconAnimation<HTMLDivElement>(ref, tl => {
      tl.to(coinRef.current, {
        rotateY: 360,
        duration: 1,
      })
    })

    return (
      <div
        ref={containerRef}
        className={cn("perspective-distant transform-3d size-[1em]", className)}
        {...props}
      >
        <div
          ref={coinRef}
          className='size-full flex items-center justify-center perspective-distant transform-3d rounded-full'
        >
          {/* front face */}
          <div
            className={cn(
              "absolute size-full rounded-full transform-3d bg-neutral-400",
              sideClassName
            )}
            style={{
              transform: `translateZ(${sideSize / 2}px)`,
            }}
          >
            <div
              className={cn(
                "absolute size-full flex items-center justify-center rounded-full backface-hidden bg-neutral-200 p-1",
                faceClassName
              )}
            >
              {children}
            </div>
          </div>

          {/* side */}
          <div
            className={cn(
              "absolute inset-y-0 w-[4px] rotate-y-90 bg-neutral-400 will-change-transform",
              sideClassName
            )}
            style={{
              width: `${sideSize - 1}px`,
            }}
          ></div>

          {/* back face */}
          <div
            className={cn(
              "absolute size-full rounded-full transform-3d bg-neutral-400",
              sideClassName
            )}
            style={{
              transform: `translateZ(${-sideSize / 2}px) rotateY(180deg)`,
            }}
          >
            <div
              className={cn(
                "absolute size-full flex items-center justify-center rounded-full backface-hidden bg-neutral-200 p-1",
                faceClassName
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
