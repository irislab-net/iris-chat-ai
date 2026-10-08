import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedWalletCards = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const topRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to("g", {
        y: 2,
        duration: 0.2,
      })
        .to(
          topRef.current,
          {
            y: -1,
            duration: 0.2,
          },
          "<"
        )
        .to("g", {
          y: 0,
          duration: 0.2,
        })
        .to(
          topRef.current,
          {
            y: 0,
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
          ref={topRef}
          d='M3 9V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V9'
        />

        <g>
          <path d='M19 7H5C3.89543 7 3 7.69645 3 8.55556V19.4444C3 20.3036 3.89543 21 5 21H19C20.1046 21 21 20.3036 21 19.4444V8.55556C21 7.69645 20.1046 7 19 7Z' />
          <path d='M3 11H6C6.8 11 7.6 11.3 8.1 11.9L9.2 12.8C10.8 14.4 13.3 14.4 14.9 12.8L16 11.9C16.5 11.4 17.3 11 18.1 11H21' />
        </g>
      </svg>
    )
  }
)
