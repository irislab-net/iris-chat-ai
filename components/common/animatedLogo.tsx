import { queryScopedTargets, setScopedIfPresent } from "@/lib/gsapScopedTargets"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"
import Logo from "./logo"

function AnimatedLogo({
  animate,
  className,
}: {
  animate?: "default" | "loading"
  className?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      const svg = svgRef.current
      if (!animate || !svg) return

      setScopedIfPresent(svg, "circle", { transformOrigin: "center" })

      const onLineCircles = queryScopedTargets(svg, "circle[data-on-line='true']")
      const offLineCircles = queryScopedTargets(
        svg,
        "circle[data-on-line='false']",
      )

      const dotsTimeline = gsap.timeline({ scope: svgRef })

      if (onLineCircles.length > 0) {
        dotsTimeline.from(onLineCircles, {
          scale: 0,
          opacity: 0,
          duration: 1,
          stagger: { amount: 1 },
          ease: "elastic.inOut",
        })
      }

      if (offLineCircles.length > 0) {
        dotsTimeline.from(
          offLineCircles,
          {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.2,
            ease: "power3.inOut",
          },
          onLineCircles.length > 0 ? "-=0.7" : undefined,
        )
      }

      const lines = queryScopedTargets(svg, ".line")
      if (lines.length === 0 && animate === "default") return

      const pathTimeline = gsap.timeline({
        scope: svgRef,
        repeat: lines.length > 0 ? -1 : 0,
      })

      if (lines.length > 0) {
        pathTimeline
          .set(lines, { drawSVG: "0% 0%", duration: 0 })
          .to(lines, { drawSVG: "0% 100%", duration: 2, ease: "power2.inOut" })
          .to(lines, { drawSVG: "0% 100%", duration: 0, delay: 5 })
          .to(lines, { drawSVG: "100% 100%", duration: 2, ease: "power2.inOut" })
      }

      if (animate === "default") return

      pathTimeline
        .to(svg, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.in",
        })
        .to(svg, {
          rotate: 90,
          scale: 1,
          duration: 0.3,
          ease: "power2.inOut",
        })
    },
    { scope: svgRef, dependencies: [animate] },
  )

  return <Logo ref={svgRef} className={className} />
}

export default AnimatedLogo
