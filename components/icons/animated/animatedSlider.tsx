import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedSlider = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const newRef = useRef<SVGRectElement>(null)
    const nextRef = useRef<SVGRectElement>(null)
    const currentRef = useRef<SVGRectElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set("rect", {
        transformOrigin: "center",
      })

      gsap.set(nextRef.current, {
        opacity: 0.5,
      })

      gsap.set(newRef.current, {
        y: -4,
        opacity: 0,
      })

      tl.to(currentRef.current, {
        y: 4,
        scale: 1.1,
        opacity: 0,
        duration: 0.4,
      })
        .to(
          nextRef.current,
          {
            attr: {
              x: 2,
              y: 7,
              width: 20,
              height: 13,
            },
            opacity: 1,
            duration: 0.4,
          },
          "<"
        )
        .to(
          newRef.current,
          {
            y: 0,
            opacity: 0.5,
            duration: 0.4,
          },
          "<+0.2"
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
        {...props}
      >
        <rect ref={newRef} x='4.75' y='2.75' width='14.5' height='1.5' rx='3' />
        <rect
          ref={nextRef}
          x='4.75'
          y='2.75'
          width='14.5'
          height='1.5'
          rx='3'
        />
        <rect ref={currentRef} x='2' y='7' width='20' height='13' rx='3' />
      </svg>
    )
  }
)
