import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedLifeBuoy = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const buoyRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(buoyRef.current, {
        transformOrigin: "center",
      })

      tl.to(buoyRef.current, {
        rotate: 90,
        scale: 1.2,
        duration: 0.3,
        ease: "none",
      }).to(buoyRef.current, {
        rotate: 180,
        scale: 1,
        duration: 0.3,
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
        strokeLinecap='round'
        strokeLinejoin='round'
        overflow='visible'
        {...props}
      >
        <g ref={buoyRef}>
          <circle cx='12' cy='12' r='10' />
          <path d='m4.93 4.93 4.24 4.24' />
          <path d='m14.83 9.17 4.24-4.24' />
          <path d='m14.83 14.83 4.24 4.24' />
          <path d='m9.17 14.83-4.24 4.24' />
          <circle cx='12' cy='12' r='4' />
        </g>
      </svg>
    )
  }
)
