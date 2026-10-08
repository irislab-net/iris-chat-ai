import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React from "react"

export const AnimatedSquareStack = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to("path:first-child", {
        x: 6,
        y: 6,
        duration: 0.5,
        ease: "back.in",
      })
        .to(
          "rect",
          {
            x: -6,
            y: -6,
            duration: 0.5,
            ease: "back.in",
          },
          "<"
        )
        .to("path:first-child", {
          x: 0,
          y: 0,
          delay: 0.2,
          duration: 0.5,
          ease: "back.out",
        })
        .to(
          "rect",
          {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "back.out",
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
        strokeWidth='2'
        overflow='visible'
        {...props}
      >
        <path d='M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2' />
        <rect width='8' height='8' x='14' y='14' rx='2' />
        <path d='M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2' />
      </svg>
    )
  }
)
