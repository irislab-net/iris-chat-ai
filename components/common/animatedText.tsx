import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useRef } from "react"

function AnimatedText({
  scrollTrigger,
  children,
  className,
}: {
  scrollTrigger?: boolean
  children?: React.ReactNode
  className?: string
}) {
  const textRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: scrollTrigger
          ? {
              trigger: textRef.current,
              start: "top bottom",
            }
          : undefined,
        scope: textRef.current,
      })

      document.fonts.ready.then(() => {
        const split = SplitText.create(textRef.current, { type: "words" })

        // now animate the characters in a staggered fashion
        tl.set(textRef.current, {
          visibility: "visible",
        })
          .set(split.words, {
            y: 24,
            translateZ: 200,
            rotateX: -45,
            autoAlpha: 0,
            transformOrigin: "bottom",
          })
          .to(
            split.words,
            {
              duration: 0.4,
              y: 0,
              rotateX: 0,
              translateZ: 0,
              autoAlpha: 1,
              stagger: 0.1,
              delay: 0.5,
            },
            "-=0.2"
          )
      })

      return () => {
        tl.kill()
      }
    },
    { scope: textRef }
  )

  return (
    <span
      ref={textRef}
      className={cn("perspective-distant invisible", className)}
    >
      {children}
    </span>
  )
}

export default AnimatedText
