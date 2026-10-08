import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedCoinStack = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const coin1Ref = useRef<SVGRectElement>(null)
    const coin2Ref = useRef<SVGRectElement>(null)
    const coin3Ref = useRef<SVGRectElement>(null)
    const coin4Ref = useRef<SVGRectElement>(null)
    const coin5Ref = useRef<SVGRectElement>(null)
    const coin6Ref = useRef<SVGRectElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(coin5Ref.current, { y: -8, opacity: 0 })
      gsap.set(coin6Ref.current, { y: -8, opacity: 0 })

      tl.to(coin1Ref.current, {
        y: 4,
        opacity: 0,
        duration: 0.2,
      })
        .to(coin2Ref.current, {
          y: 4,
          opacity: 0,
          duration: 0.4,
        })
        .to(coin3Ref.current, {
          y: 8,
          duration: 0.2,
        })
        .to(
          coin4Ref.current,
          {
            y: 8,
            duration: 0.4,
          },
          "<"
        )
        .to(coin5Ref.current, {
          y: 0,
          opacity: 1,
          duration: 0.2,
        })
        .to(coin6Ref.current, {
          y: 0,
          opacity: 1,
          duration: 0.4,
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
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
        overflow='visible'
        {...props}
      >
        <defs>
          <mask id='coin-stack-mask'>
            <rect x='0' y='0' width='24' height='24' fill='white' />
            <circle cx='16.5' cy='13.5' r='9' fill='black' stroke='none' />
          </mask>
        </defs>

        <g mask='url(#coin-stack-mask)'>
          <rect ref={coin1Ref} x='2' y='16' width='15' height='4' rx='1.2' />
          <rect ref={coin2Ref} x='1' y='12' width='15' height='4' rx='1.2' />
          <rect ref={coin3Ref} x='2' y='8' width='15' height='4' rx='1.2' />
          <rect ref={coin4Ref} x='1' y='4' width='15' height='4' rx='1.2' />
          <rect ref={coin5Ref} x='2' y='8' width='15' height='4' rx='1.2' />
          <rect ref={coin6Ref} x='1' y='4' width='15' height='4' rx='1.2' />
        </g>

        <circle cx='16.5' cy='13.5' r='6.5' />
        <path d='M18 10.8235C17 10.8235 17 10.8235 16.5 10.8213M16.5 16.1765C18 16.1765 18 15.3824 18 14.9412C18 14.5 18 13.2941 16.5 13.2941C15 13.2941 15 12.4706 15 12.0588C15 11.6471 15 10.8235 16.5 10.8213M16.5 16.1765H15M16.5 16.1765V17.5M16.5 10.8213V9.5' />
      </svg>
    )
  }
)
