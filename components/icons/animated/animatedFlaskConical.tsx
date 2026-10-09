import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedFlaskConical = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const lineRef = useRef<SVGPathElement>(null)
    const flaskRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(lineRef.current, {
        transformOrigin: "left",
      })

      gsap.set(flaskRef.current, {
        transformOrigin: "bottom right",
      })

      tl.to(flaskRef.current, {
        rotate: 15,
        duration: 0.5,
        ease: "back.out",
      })
        .to(
          lineRef.current,
          {
            rotate: -15,
            scaleX: 1.05,
            duration: 0.6,
            ease: "back.out",
          },
          "<"
        )
        .to(lineRef.current, {
          rotate: -13,
          duration: 0.2,
          ease: "back.out",
        })
        .to(flaskRef.current, {
          rotate: 0,
          delay: 0.4,
          duration: 0.5,
          ease: "back.out",
        })
        .to(
          lineRef.current,
          {
            rotate: 2,
            scaleX: 1,
            duration: 0.3,
            ease: "back.out",
          },
          "<"
        )
        .to(lineRef.current, {
          rotate: 0,
          duration: 0.1,
          ease: "back.out",
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
        <g ref={flaskRef}>
          <path d='M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2' />
          <path d='M8.5 2h7' />
        </g>

        <path ref={lineRef} d='M6.453 15h11.094' />
      </svg>
    )
  }
)
