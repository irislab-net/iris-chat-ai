import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedShieldHalf = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const rightHalfRef = useRef<SVGGElement>(null)
    const leftHalfRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set(rightHalfRef.current, {
        transformOrigin: "bottom right",
      })
        .set(leftHalfRef.current, {
          transformOrigin: "bottom left",
        })
        .to(leftHalfRef.current, {
          x: -2,
          rotate: -2,
          duration: 0.4,
        })
        .to(
          rightHalfRef.current,
          {
            x: 4,
            rotate: 6,
            duration: 0.5,
          },
          "<"
        )
        .to(leftHalfRef.current, {
          x: 0,
          rotate: 0,
          duration: 0.2,
        })
        .to(
          rightHalfRef.current,
          {
            x: 0,
            rotate: 0,
            duration: 0.2,
          },
          "<"
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
        overflow='visible'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <g ref={rightHalfRef}>
          <path d='M12.34 21.95C16.5 20.5 20 18 20 13V6.00002C20 5.73481 19.8946 5.48045 19.7071 5.29292C19.5196 5.10538 19.2652 5.00002 19 5.00002C17 5.00002 14.51 3.81002 12.76 2.28002C12.5481 2.09902 12.2786 1.99957 12 1.99957' />
          <path d='M12 22V2' />
        </g>

        <g ref={leftHalfRef}>
          <path d='M11.67 21.94C7.5 20.5 4 18 4 13V6.00002C4 5.73481 4.10536 5.48045 4.29289 5.29292C4.48043 5.10538 4.73478 5.00002 5 5.00002C7 5.00002 9.5 3.80002 11.24 2.28002C11.4519 2.09902 11.7214 1.99957 12 1.99957' />
          <path d='M12 22V2' />
        </g>
      </svg>
    )
  }
)
