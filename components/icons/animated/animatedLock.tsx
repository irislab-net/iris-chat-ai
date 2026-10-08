import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React from "react"

export const AnimatedLock = React.forwardRef<AnimationHandle>((props, ref) => {
  const { containerRef } = useIconAnimation(ref, tl => {
    tl.to("path", {
      drawSVG: "0% 70%",
      y: -1,
      duration: 0.3,
      ease: "back.out",
    }).to("path", {
      drawSVG: "0% 100%",
      y: 0,
      duration: 0.3,
      delay: 0.2,
      ease: "back.in",
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
      <rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
      <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </svg>
  )
})
