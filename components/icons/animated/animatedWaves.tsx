import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React from "react"

export const AnimatedWaves = React.forwardRef<AnimationHandle>((props, ref) => {
  const { containerRef } = useIconAnimation(ref, tl => {
    tl.to("path", {
      drawSVG: "20% 90%",
      x: 4,
      duration: 0.3,
      stagger: -0.1,
      ease: "sine.inOut",
    })
      .to("path", {
        drawSVG: "10% 80%",
        x: -4,
        duration: 0.3,
        stagger: -0.1,
        ease: "sine.inOut",
      })
      .to(
        "path",
        {
          drawSVG: "0% 100%",
          x: 0,
          duration: 0.3,
          stagger: -0.1,
          ease: "sine.inOut",
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
      strokeLinecap='round'
      strokeLinejoin='round'
      overflow='visible'
      {...props}
    >
      <path d='M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1' />
      <path d='M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1' />
      <path d='M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1' />
    </svg>
  )
})
