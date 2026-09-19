"use client"

import { useReducedMotion } from "@/lib/landing-motion"
import { useEffect, useRef } from "react"

import { HERO_VIDEO } from "@/lib/landing-modern-data"

type HeroVideoBgProps = {
  playing: boolean
}

export function HeroVideoBg({ playing }: HeroVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduceMotion) return

    if (playing) {
      void video.play().catch(() => {})
      return
    }

    video.pause()
  }, [playing, reduceMotion])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-105 object-cover"
        src={HERO_VIDEO.src}
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* Blue brand gradient — tints the video */}
      <div
        className="absolute inset-0 opacity-[0.72] mix-blend-multiply"
        style={{
          background:
            "linear-gradient(160deg, #1e40af 0%, #2563eb 38%, #3b82f6 72%, #60a5fa 100%)",
        }}
      />

      {/* Soft blue wash so motion still reads through */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,64,175,0.45)_0%,rgba(37,99,235,0.35)_45%,rgba(29,78,216,0.55)_100%)]"
      />

      {/* Sphere-style radial highlights */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 28%, rgba(254, 243, 199, 0.12), transparent 58%),
            radial-gradient(ellipse 55% 45% at 50% 100%, rgba(29, 78, 216, 0.35), transparent 62%)
          `,
        }}
      />

      {/* Edge vignette for text contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(15,23,42,0.35)_100%)]" />
    </div>
  )
}
