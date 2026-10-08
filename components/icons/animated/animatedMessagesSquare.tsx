import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedMessagesSquare = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const questionRef = useRef<SVGPathElement>(null)
    const answerRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.to(questionRef.current, {
        y: -4,
        x: -2,
        opacity: 0,
        rotate: -15,
        duration: 0.4,
        ease: "back.in",
      })
        .to(answerRef.current, {
          scaleX: 0,
          x: 4,
          y: -3.5,
          duration: 0.3,
          ease: "back.in",
        })
        .set(questionRef.current, {
          scaleX: 0,
          rotate: 0,
          x: 9,
          y: 4,
          opacity: 1,
        })
        .to(questionRef.current, {
          scaleX: 1,
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "back.out",
        })
        .set(answerRef.current, {
          scaleX: 1,
          opacity: 0,
          rotate: -15,
          y: 4,
          x: 2,
        })
        .to(answerRef.current, {
          opacity: 1,
          rotate: 0,
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "back.out",
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
        strokeLinecap='round'
        strokeLinejoin='round'
        overflow='visible'
        {...props}
      >
        <path
          ref={questionRef}
          d='M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'
        />
        <path
          ref={answerRef}
          d='M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1'
        />
      </svg>
    )
  }
)
