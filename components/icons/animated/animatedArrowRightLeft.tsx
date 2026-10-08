import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedArrowRightLeft = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const rightRef = useRef<SVGPathElement>(null)
    const rightLineRef = useRef<SVGPathElement>(null)
    const leftRef = useRef<SVGPathElement>(null)
    const leftLineRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to(rightLineRef.current, {
        drawSVG: "0% 0%",
        duration: 0.2,
      })
        .to(rightRef.current, {
          x: 4,
          duration: 0.1,
        })
        .to(rightRef.current, {
          x: 0,
          duration: 0.1,
        })
        .to(rightLineRef.current, {
          drawSVG: "100% 100%",
          duration: 0,
        })
        .to(rightLineRef.current, {
          drawSVG: "0% 100%",
          duration: 0.2,
        })
        .to(
          leftLineRef.current,
          {
            drawSVG: "0% 0%",
            duration: 0.2,
          },
          "<"
        )
        .to(leftRef.current, {
          x: -4,
          duration: 0.1,
        })
        .to(leftRef.current, {
          x: 0,
          duration: 0.1,
        })
        .to(leftLineRef.current, {
          drawSVG: "100% 100%",
          duration: 0,
        })
        .to(leftLineRef.current, {
          drawSVG: "0% 100%",
          duration: 0.2,
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
        <path ref={rightRef} d='m16 3 4 4-4 4' />
        <path ref={rightLineRef} d='M20 7H4' />
        <path ref={leftRef} d='m8 21-4-4 4-4' />
        <path ref={leftLineRef} d='M4 17h16' />
      </svg>
    )
  }
)
