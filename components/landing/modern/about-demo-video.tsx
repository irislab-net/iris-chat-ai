"use client"

import { PauseIcon, PlayIcon } from "lucide-react"
import { useReducedMotion } from "motion/react"
import * as React from "react"

import { ABOUT_DEMO_VIDEO } from "@/lib/landing-modern-data"
import { cn } from "@/lib/utils"

export function AboutDemoVideo() {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()
  const [playing, setPlaying] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  const togglePlay = React.useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      try {
        await video.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
      return
    }

    video.pause()
    setPlaying(false)
  }, [])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onCanPlay = () => setReady(true)
    const onEnded = () => setPlaying(false)

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("canplay", onCanPlay)
    video.addEventListener("ended", onEnded)

    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("canplay", onCanPlay)
      video.removeEventListener("ended", onEnded)
    }
  }, [])

  return (
    <div
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-[2rem]",
        "bg-[#0F172A] shadow-[0_30px_80px_rgba(15,23,42,0.14)] ring-1 ring-black/6"
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={ABOUT_DEMO_VIDEO.src}
        poster={ABOUT_DEMO_VIDEO.poster}
        playsInline
        preload="metadata"
        controls={playing}
        aria-label="Exur product demo"
      />

      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center",
            "bg-[radial-gradient(ellipse_at_50%_40%,rgba(37,99,235,0.25),rgba(15,23,42,0.55)_70%)]",
            "transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-90"
          )}
          aria-label="Play product demo"
        >
          <span
            className={cn(
              "flex size-16 items-center justify-center rounded-full",
              "border border-white/25 bg-white/15 text-white backdrop-blur-md",
              "transition-transform duration-300 group-hover:scale-105",
              !reduceMotion && "shadow-[0_0_40px_rgba(56,189,248,0.35)]"
            )}
          >
            <PlayIcon className="ml-0.5 size-7 fill-white" />
          </span>
        </button>
      )}

      {playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-label="Pause product demo"
        >
          <PauseIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
