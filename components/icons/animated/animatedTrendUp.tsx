import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedTrendUp = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const arrowRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set("path:last-child", {
        drawSVG: "100% 100%",
      })

      tl.to("path:first-child", {
        drawSVG: "0% 0%",
        duration: 0.5,
        ease: "none",
      })
        .to(
          arrowRef.current,
          {
            x: 1,
            y: -1,
            duration: 0.1,
            ease: "none",
          },
          "-=0.1"
        )
        .to(arrowRef.current, {
          x: 0,
          y: 0,
          duration: 0.1,
          ease: "none",
        })
        .to(
          "path:last-child",
          {
            drawSVG: "0% 100%",
            duration: 0.5,
            ease: "none",
          },
          "-=0.2"
        )
        .to(
          arrowRef.current,
          {
            x: 1,
            y: -1,
            duration: 0.1,
            ease: "none",
          },
          "-=0.1"
        )
        .to(arrowRef.current, {
          x: 0,
          y: 0,
          duration: 0.1,
          ease: "none",
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
        overflow='visible'
        {...props}
      >
        <path d='m22 7-8.5 8.5-5-5L2 17' />
        <path ref={arrowRef} d='M16 7h6v6' />
        <path d='m22 7-8.5 8.5-5-5L2 17' />
      </svg>
    )
  }
)
