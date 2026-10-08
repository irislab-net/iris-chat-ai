import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedUsers = React.forwardRef<AnimationHandle>((props, ref) => {
  const sideUserRef = useRef<SVGGElement>(null)
  const userRef = useRef<SVGGElement>(null)
  const halfUserRef = useRef<SVGGElement>(null)
  const newUserRef = useRef<SVGGElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set(sideUserRef.current, {
      transformOrigin: "center",
    })

    gsap.set(newUserRef.current, {
      x: -4,
      opacity: 0,
    })

    tl.to(sideUserRef.current, {
      x: 4,
      scale: 0.9,
      opacity: 0,
      duration: 0.4,
      ease: "back.out",
    })
      .to(
        userRef.current,
        {
          x: 6,
          opacity: 0,
          duration: 0.4,
          ease: "back.inOut",
        },
        "<+0.2"
      )
      .to(
        halfUserRef.current,
        {
          x: 6,
          duration: 0.4,
          ease: "back.inOut",
        },
        "<"
      )
      .to(
        newUserRef.current,
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: "back.in",
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
      <g ref={sideUserRef}>
        <path d='M16 3.12799C16.8578 3.35036 17.6174 3.85125 18.1597 4.55205C18.702 5.25285 18.9962 6.11388 18.9962 6.99999C18.9962 7.8861 18.702 8.74713 18.1597 9.44793C17.6174 10.1487 16.8578 10.6496 16 10.872' />
        <path d='M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13' />
      </g>

      <g ref={userRef}>
        <path d='M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21' />
        <path d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z' />
      </g>

      <g ref={halfUserRef}>
        <path d='M10 3.12799C10.8578 3.35036 11.6174 3.85125 12.1597 4.55205C12.702 5.25285 12.9962 6.11388 12.9962 6.99999C12.9962 7.8861 12.702 8.74713 12.1597 9.44793C11.6174 10.1487 10.8578 10.6496 10 10.872' />
        <path d='M16 21V19C15.9993 18.1137 15.7044 17.2528 15.1614 16.5523C14.6184 15.8519 13.8581 15.3516 13 15.13' />
      </g>

      <g ref={newUserRef}>
        <path d='M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21' />
        <path d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z' />
      </g>
    </svg>
  )
})
