import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedScrollText = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const bottomRef = useRef<SVGPathElement>(null)
    const paperRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set(paperRef.current, {
        transformOrigin: "center top",
      })
        .to(paperRef.current, {
          scaleY: 0.6,
          duration: 0.5,
          ease: "back.inOut",
        })
        .to(
          bottomRef.current,
          {
            y: -5,
            duration: 0.5,
            ease: "back.inOut",
          },
          "<"
        )
        .to(
          ".scroll-text",
          {
            drawSVG: "100% 100%",
            opacity: 0,
            stagger: 0.2,
            duration: 0.5,
            ease: "back.out",
          },
          "<"
        )
        .to(paperRef.current, {
          scaleY: 1,
          duration: 0.5,
          ease: "back.inOut",
        })
        .to(
          bottomRef.current,
          {
            y: 0,
            duration: 0.5,
            ease: "back.inOut",
          },
          "<"
        )
        .to(
          ".scroll-text",
          {
            drawSVG: "0% 100%",
            opacity: 1,
            stagger: -0.2,
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
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <g ref={paperRef}>
          <path d='M19 17V5' />
          <path d='M6 19V5' />
        </g>

        <path d='M6 5C6 4.46957 5.78929 3.96086 5.41421 3.58579C5.03914 3.21071 4.53043 3 4 3C3.46957 3 2.96086 3.21071 2.58579 3.58579C2.21071 3.96086 2 4.46957 2 5V7C2 7.26522 2.10536 7.51957 2.29289 7.70711C2.48043 7.89464 2.73478 8 3 8H6' />
        <path d='M19 5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3H4' />

        <path
          ref={bottomRef}
          d='M8 21H20C20.5304 21 21.0391 20.7893 21.4142 20.4142C21.7893 20.0391 22 19.5304 22 19V18C22 17.7348 21.8946 17.4804 21.7071 17.2929C21.5196 17.1054 21.2652 17 21 17H11C10.7348 17 10.4804 17.1054 10.2929 17.2929C10.1054 17.4804 10 17.7348 10 18V19C10 19.5304 9.78929 20.0391 9.41421 20.4142C9.03914 20.7893 8.53043 21 8 21ZM8 21C7.46957 21 6.96086 20.7893 6.58579 20.4142C6.21071 20.0391 6 19.5304 6 19'
        />

        <path className='scroll-text' d='M15 12H10' />
        <path className='scroll-text' d='M15 8H10' />
      </svg>
    )
  }
)
