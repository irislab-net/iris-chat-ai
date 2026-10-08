import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedTarget = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const circle0Ref = useRef<SVGCircleElement>(null)
    const circle1Ref = useRef<SVGCircleElement>(null)
    const circle2Ref = useRef<SVGCircleElement>(null)
    const circle3Ref = useRef<SVGCircleElement>(null)

    const { containerRef } = useIconAnimation(
      ref,
      tl => {
        tl.to(circle3Ref.current, {
          attr: {
            r: 12,
          },
          opacity: 0,
          duration: 0.3,
          ease: "none",
        })
          .to(
            circle2Ref.current,
            {
              attr: {
                r: 10,
              },
              duration: 0.3,
              ease: "none",
            },
            "<"
          )
          .to(
            circle1Ref.current,
            {
              attr: {
                r: 6,
              },
              duration: 0.3,
              ease: "none",
            },
            "<"
          )
          .to(
            circle0Ref.current,
            {
              attr: {
                r: 2,
              },
              duration: 0.3,
              ease: "none",
            },
            "<"
          )
      },
      { repeat: 1 }
    )

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
        <circle ref={circle0Ref} cx='12' cy='12' r='0' />
        <circle ref={circle1Ref} cx='12' cy='12' r='2' />
        <circle ref={circle2Ref} cx='12' cy='12' r='6' />
        <circle ref={circle3Ref} cx='12' cy='12' r='10' />
      </svg>
    )
  }
)
