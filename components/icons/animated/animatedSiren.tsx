import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedSiren = React.forwardRef<AnimationHandle>((props, ref) => {
  const lampRef = useRef<SVGPathElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    tl.to("g path", {
      opacity: 0,
      stagger: 0.05,
      duration: 0.2,
    })
      .to(
        lampRef.current,
        {
          opacity: 0.5,
          duration: 0.2,
        },
        "<"
      )
      .to(lampRef.current, {
        opacity: 1,
        duration: 0.2,
      })
      .to(
        "g path",
        {
          opacity: 1,
          stagger: 0.05,
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
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <path ref={lampRef} d='M7 18v-6a5 5 0 1 1 10 0v6' />
      <path d='M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z' />
      <path d='M12 12v6' />

      <g>
        <path d='M2 12h1' />
        <path d='m4.929 4.929.707.707' />
        <path d='M12 2v1' />
        <path d='M18.5 4.5 18 5' />
        <path d='M21 12h1' />
      </g>
    </svg>
  )
})
