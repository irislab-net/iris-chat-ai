import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React from "react"

export const AnimatedDollarSign = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to("line", {
        drawSVG: "100% 100%",
        duration: 0.4,
        ease: "none",
      })
        .to(
          "path",
          {
            drawSVG: "100% 100%",
            duration: 0.4,
            ease: "none",
          },
          "<+=0.2"
        )
        .set("path", {
          drawSVG: "0% 0%",
        })
        .set("line", {
          drawSVG: "0% 0%",
        })
        .to("line", {
          drawSVG: "0% 100%",
          duration: 0.4,
          ease: "none",
        })
        .to(
          "path",
          {
            drawSVG: "0% 100%",
            duration: 0.4,
            ease: "none",
          },
          "<+=0.2"
        )
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
        overflow='visible'
        {...props}
      >
        <line x1='12' x2='12' y1='2' y2='22' />
        <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
      </svg>
    )
  }
)
