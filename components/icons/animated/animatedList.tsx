import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedList = React.forwardRef<AnimationHandle>((props, ref) => {
  const topRef = useRef<SVGGElement>(null)
  const middleRef = useRef<SVGGElement>(null)
  const bottomRef = useRef<SVGGElement>(null)
  const bottomCircleRef = useRef<SVGCircleElement>(null)
  const bottomLineRef = useRef<SVGPathElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    tl.set(bottomRef.current, { opacity: 0, y: 6, duration: 0 })
      .set(bottomCircleRef.current, {
        opacity: 0,
        scale: 0,
        transformOrigin: "center",
        duration: 0,
      })
      .set(bottomLineRef.current, {
        opacity: 0,
        drawSVG: "0% 0%",
        duration: 0,
      })
      .to(topRef.current, {
        y: -6,
        opacity: 0,
        duration: 0.2,
      })
      .to(
        middleRef.current,
        {
          y: -6,
          duration: 0.2,
        },
        "<"
      )
      .to(
        bottomRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.2,
        },
        "<"
      )
      .to(bottomCircleRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.2,
      })
      .to(
        bottomLineRef.current,
        {
          drawSVG: "0% 100%",
          opacity: 1,
          duration: 0.2,
        },
        "<+=0.1"
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
      <g ref={topRef}>
        <circle cx='3.5' cy='6' r='1.5' strokeWidth='0.5' fill='currentColor' />
        <path d='M8 6H21' />
      </g>

      <g ref={middleRef}>
        <circle
          cx='3.5'
          cy='12'
          r='1.5'
          strokeWidth='0.5'
          fill='currentColor'
        />
        <path d='M8 12H21' />

        <circle
          cx='3.5'
          cy='18'
          r='1.5'
          strokeWidth='0.5'
          fill='currentColor'
        />
        <path d='M8 18H21' />
      </g>

      <g ref={bottomRef} className='opacity-0'>
        <circle
          ref={bottomCircleRef}
          cx='3.5'
          cy='18'
          r='1.5'
          strokeWidth='0.5'
          fill='currentColor'
        />
        <path ref={bottomLineRef} d='M8 18H21' />
      </g>
    </svg>
  )
})
