import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedBookA = React.forwardRef<AnimationHandle>((props, ref) => {
  const coverRef = useRef<SVGPathElement>(null)
  const bottomRef = useRef<SVGPathElement>(null)
  const letterRef = useRef<SVGGElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    tl.set(bottomRef.current, {
      transformOrigin: "bottom",
    })
      .set(coverRef.current, {
        transformOrigin: "top",
      })
      .set(letterRef.current, {
        transformOrigin: "bottom",
      })
      .to(bottomRef.current, {
        scaleY: 0,
        duration: 0.2,
      })
      .to(
        coverRef.current,
        {
          scaleY: 1.2,
          y: 2,
          duration: 0.2,
        },
        "<"
      )
      .to(
        letterRef.current,
        {
          y: 3,
          rotateX: 30,
          duration: 0.2,
        },
        "<"
      )
      .to(bottomRef.current, {
        scaleY: 1,
        duration: 0.2,
        delay: 0.3,
      })
      .to(
        coverRef.current,
        {
          scaleY: 1,
          y: 0,
          duration: 0.2,
        },
        "<"
      )
      .to(
        letterRef.current,
        {
          y: 0,
          rotateX: 0,
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
      <path
        ref={bottomRef}
        d='M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H19C19.2652 22 19.5196 21.8946 19.7071 21.7071C19.8946 21.5196 20 21.2652 20 21V17M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M4 19.5V15M20 17V15'
      />

      <g ref={letterRef}>
        <path d='M8 13L12 6L16 13' />
        <path d='M9.10001 11H14.8' />
      </g>

      <path
        ref={coverRef}
        d='M4 3.875V15.125C4 15.6223 4.26339 16.0992 4.73223 16.4508C5.20107 16.8025 5.83696 17 6.5 17H19C19.2652 17 19.5196 16.921 19.7071 16.7803C19.8946 16.6397 20 16.4489 20 16.25V2.75C20 2.55109 19.8946 2.36032 19.7071 2.21967C19.5196 2.07902 19.2652 2 19 2H6.5C5.83696 2 5.20107 2.19754 4.73223 2.54917C4.26339 2.90081 4 3.37772 4 3.875Z'
      />
    </svg>
  )
})
