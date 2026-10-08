import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useId, useRef } from "react"

const TOP_ARC_PATH =
  "M4.79938 29.5778C3.71994 29.3435 3.02626 28.2759 3.31848 27.2107C5.38563 19.6754 9.79184 12.9694 15.9268 8.07547C22.5842 2.76486 30.8697 -0.0866755 39.3853 0.0020062C47.9009 0.0906879 56.1252 3.11416 62.6706 8.56226C68.7023 13.5829 72.9679 20.3792 74.8777 27.9559C75.1476 29.027 74.4319 30.0799 73.3478 30.2917C72.2637 30.5034 71.216 29.7947 70.939 28.7255C69.2107 22.0536 65.4302 16.0722 60.1074 11.6416C54.2708 6.78349 46.9371 4.08741 39.3436 4.00833C31.7501 3.92925 24.3618 6.47201 18.4253 11.2076C13.0113 15.5263 9.10714 21.4277 7.24022 28.0621C6.94101 29.1254 5.87883 29.8121 4.79938 29.5778Z"

const BOTTOM_ARC_PATH =
  "M73.29 43.9975C74.3723 44.2183 75.0792 45.2773 74.8002 46.3461C72.8266 53.9064 68.5039 60.6666 62.4301 65.6362C55.8391 71.0289 47.5896 73.983 39.0735 73.9999C30.5575 74.0169 22.2963 71.0956 15.6839 65.7291C9.59039 60.7837 5.24084 54.0407 3.23726 46.4883C2.95402 45.4207 3.65668 44.3589 4.73806 44.1337C5.81944 43.9086 6.87579 44.6042 7.16603 45.67C8.97699 52.3199 12.8313 58.2539 18.2087 62.6182C24.1051 67.4036 31.4717 70.0085 39.0656 69.9934C46.6595 69.9783 54.0157 67.3441 59.893 62.5353C65.253 58.1498 69.0837 52.2004 70.8682 45.5434C71.1542 44.4765 72.2078 43.7766 73.29 43.9975Z"

const LOGO_PATH = "M52 52V29L39 40.6139L26 29V52"

type USDMIconProps = React.SVGProps<SVGSVGElement> & {
  autoplay?: boolean
  /** GSAP timeline repeat; `-1` loops forever. */
  repeat?: number
  repeatDelay?: number
}

const USDMIcon = React.forwardRef<AnimationHandle, USDMIconProps>(function USDMIcon(
  { className, autoplay = false, repeat = 0, repeatDelay = 2.5, ...props },
  ref
) {
    const topMaskId = useId()
    const bottomMaskId = useId()
    const topArcRef = useRef<SVGPathElement>(null)
    const bottomArcRef = useRef<SVGPathElement>(null)
    const logoRef = useRef<SVGPathElement>(null)
    const dotsRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(
      ref,
      tl => {
      gsap.set([topArcRef.current, bottomArcRef.current, logoRef.current], {
        drawSVG: "0% 0%",
      })
      gsap.set(dotsRef.current?.children ?? [], {
        scale: 0.35,
        opacity: 0,
        transformOrigin: "center center",
      })

      tl.to([topArcRef.current, bottomArcRef.current], {
        drawSVG: "0% 100%",
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      })
        .to(
          logoRef.current,
          {
            drawSVG: "0% 100%",
            duration: 0.45,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .to(
          dotsRef.current?.children ?? [],
          {
            scale: 1,
            opacity: 1,
            duration: 0.28,
            stagger: 0.06,
            ease: "back.out(2.4)",
          },
          "-=0.15"
        )
      },
      { repeat, repeatDelay },
      { autoplay }
    )

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 78 74'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={className ?? "size-[1em]"}
        overflow='visible'
        {...props}
      >
        <mask id={bottomMaskId} fill='white'>
          <path d={TOP_ARC_PATH} />
        </mask>
        <mask id={topMaskId} fill='white'>
          <path d={BOTTOM_ARC_PATH} />
        </mask>
        <path
          ref={topArcRef}
          d={TOP_ARC_PATH}
          stroke='currentColor'
          strokeWidth='8'
          strokeLinecap='round'
          strokeLinejoin='round'
          mask={`url(#${bottomMaskId})`}
        />
        <path
          ref={bottomArcRef}
          d={BOTTOM_ARC_PATH}
          stroke='currentColor'
          strokeWidth='8'
          strokeLinecap='round'
          strokeLinejoin='round'
          mask={`url(#${topMaskId})`}
        />
        <path
          ref={logoRef}
          d={LOGO_PATH}
          stroke='currentColor'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <g ref={dotsRef} fill='currentColor'>
          <circle cx='5' cy='37' r='5' />
          <circle cx='73' cy='37' r='5' />
          <circle cx='39' cy='19' r='5' />
        </g>
      </svg>
    )
})

USDMIcon.displayName = "USDMIcon"

export default USDMIcon