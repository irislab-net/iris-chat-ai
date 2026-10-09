import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedWaveLadder = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const waveRef = useRef<SVGPathElement>(null)
    const ladderRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set(ladderRef.current, {
        transformOrigin: "bottom",
      })
        .to(waveRef.current, {
          drawSVG: "0% 85%",
          x: -2,
          duration: 0.4,
        })
        .to(
          ladderRef.current,
          {
            rotate: -3,
          },
          "<"
        )
        .to(waveRef.current, {
          drawSVG: "15% 100%",
          x: 2,
          duration: 0.6,
        })
        .to(
          ladderRef.current,
          {
            rotate: 3,
          },
          "<"
        )
        .to(waveRef.current, {
          drawSVG: "0% 100%",
          x: 0,
          duration: 0.4,
        })
        .to(
          ladderRef.current,
          {
            rotate: 0,
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
        <g ref={ladderRef}>
          <path d='M19 5a2 2 0 0 0-2 2v11' />
          <path d='M7 13h10' />
          <path d='M7 9h10' />
          <path d='M9 5a2 2 0 0 0-2 2v11' />
        </g>

        <path
          ref={waveRef}
          d='M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1'
        />
      </svg>
    )
  }
)
