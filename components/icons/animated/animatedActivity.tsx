import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedActivity = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const pathRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to(pathRef.current, {
        drawSVG: "0% 0%",
        duration: 0.3,
      })
        .set(pathRef.current, {
          drawSVG: "100% 100%",
          duration: 0,
        })
        .to(pathRef.current, {
          drawSVG: "0% 100%",
          duration: 0.3,
        })
    })

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 24 24'
        fill='none'
        className='size-[1em]'
        xmlns='http://www.w3.org/2000/svg'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <path
          ref={pathRef}
          d='M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'
        />
      </svg>
    )
  }
)
