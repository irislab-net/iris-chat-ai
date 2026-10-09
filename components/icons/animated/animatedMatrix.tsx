import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React from "react"

export const AnimatedMatrix = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to("path", {
        drawSVG: "100% 100%",
        duration: 0.5,
      })
        .to("path", {
          drawSVG: "0% 0%",
          duration: 0,
        })
        .to("path", {
          drawSVG: "0% 100%",
          duration: 0.5,
          delay: 0.1,
        })
    })

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 100 100'
        fill='none'
        className='size-[1em]'
        xmlns='http://www.w3.org/2000/svg'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <path
          className='line'
          d='M13 87V13L50 50L87 13V87'
          stroke='currentColor'
          strokeWidth='5'
        />

        <g fill='currentColor'>
          <circle
            className='dot-sm on-line left-bottom'
            cx='13'
            cy='87'
            r='7'
          />
          <circle className='dot-lg on-line left' cx='13' cy='50' r='12' />
          <circle className='dot-sm on-line left-top' cx='13' cy='13' r='7' />
          <circle className='dot-lg on-line center' cx='50' cy='50' r='12' />
          <circle className='dot-lg top' cx='50' cy='13' r='12' />
          <circle className='dot-sm on-line right-top' cx='87' cy='13' r='7' />
          <circle className='dot-lg on-line right' cx='87' cy='50' r='12' />
          <circle
            className='dot-sm on-line right-bottom'
            cx='87'
            cy='87'
            r='7'
          />
          <circle className='dot-lg bottom' cx='50' cy='87' r='12' />
        </g>
      </svg>
    )
  }
)
