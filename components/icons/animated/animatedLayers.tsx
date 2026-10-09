import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedLayers = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const layer1Ref = useRef<SVGPathElement>(null)
    const layer2Ref = useRef<SVGPathElement>(null)
    const layer3Ref = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set([layer1Ref.current, layer2Ref.current, layer3Ref.current], {
        transformOrigin: "center",
      })
        .fromTo(
          layer1Ref.current,
          { y: 2, opacity: 0.6 },
          { y: 0, opacity: 1, duration: 0.25, ease: "sine.inOut" }
        )
        .fromTo(
          layer2Ref.current,
          { y: 2, opacity: 0.6 },
          { y: 0, opacity: 1, duration: 0.25, ease: "sine.inOut" },
          "<0.05"
        )
        .fromTo(
          layer3Ref.current,
          { y: 2, opacity: 0.6 },
          { y: 0, opacity: 1, duration: 0.25, ease: "sine.inOut" },
          "<0.05"
        )
    })

    return (
      <svg
        ref={containerRef}
        viewBox="0 0 24 24"
        fill="none"
        className="size-[1em]"
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        overflow="visible"
        {...props}
      >
        <path
          ref={layer1Ref}
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
        />
        <path
          ref={layer2Ref}
          d="m2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"
        />
        <path
          ref={layer3Ref}
          d="m2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"
        />
      </svg>
    )
  }
)
