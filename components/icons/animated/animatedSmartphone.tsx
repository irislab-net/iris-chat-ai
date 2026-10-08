import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedSmartphone = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const notchRef = useRef<SVGRectElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set("circle", {
        transformOrigin: "center",
      })

      gsap.set(notchRef.current, {
        scaleX: 0.5,
        opacity: 0,
        transformOrigin: "center",
      })

      gsap.set("g rect", {
        transformOrigin: "center",
        opacity: 0,
        scale: 0.8,
        y: 1,
      })

      tl.to("circle", {
        opacity: 0.8,
        scale: 0.8,
        duration: 0.1,
        ease: "sine.in",
      })
        .to("circle", {
          opacity: 1,
          scale: 1,
          duration: 0.1,
          delay: 0.1,
          ease: "sine.in",
        })
        .to(notchRef.current, {
          scaleX: 1,
          opacity: 1,
          duration: 0.3,
          ease: "sine.in",
        })
        .to(
          "g rect",
          {
            opacity: 0.5,
            scale: 1,
            y: 0,
            duration: 0.1,
            stagger: 0.03,
            ease: "sine.in",
          },
          "<"
        )
        .to("circle", {
          opacity: 0.8,
          scale: 0.8,
          duration: 0.1,
          delay: 0.5,
          ease: "sine.in",
        })
        .to("circle", {
          opacity: 1,
          scale: 1,
          duration: 0.1,
          delay: 0.1,
          ease: "sine.in",
        })

        .to("g rect", {
          opacity: 0,
          scale: 0.8,
          y: 1,
          duration: 0.2,
          stagger: 0.03,
          ease: "sine.in",
        })
        .to(notchRef.current, {
          scaleX: 0.5,
          opacity: 0,
          duration: 0.3,
          ease: "sine.in",
        })
    })

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 24 24'
        fill='currentColor'
        className='size-[1em]'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
      >
        <path
          d='M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <circle cx='12' cy='18' r='1' />
        <rect ref={notchRef} x='10' y='4' width='4' height='1' rx='0.5' />

        <g>
          <rect x='8' y='7' width='2' height='2' rx='1' />
          <rect x='11' y='7' width='2' height='2' rx='1' />
          <rect x='14' y='7' width='2' height='2' rx='1' />
          <rect x='8' y='10' width='2' height='2' rx='1' />
          <rect x='11' y='10' width='2' height='2' rx='1' />
          <rect x='14' y='10' width='2' height='2' rx='1' />
          <rect x='8' y='13' width='2' height='2' rx='1' />
          <rect x='11' y='13' width='2' height='2' rx='1' />
          <rect x='14' y='13' width='2' height='2' rx='1' />
        </g>
      </svg>
    )
  }
)
