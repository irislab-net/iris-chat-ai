"use client"

import { gsap } from "gsap"
import { PlayIcon, XIcon } from "lucide-react"
import * as React from "react"

import { AboutOrbCanvas } from "@/components/landing/modern/about-orb-canvas"
import { Button } from "@/components/ui/button"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  ABOUT_NARRATION_CUES,
  ABOUT_NARRATION_DURATION,
  ABOUT_NARRATION_SRC,
  cueIndexAt,
} from "@/lib/about-narration"
import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_MOTION, useReducedMotion } from "@/lib/landing-motion"
import {
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
  landingTitleQuote,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/** Voice sits in the low-mid bins; ignore the rest so the orb tracks speech. */
const VOICE_BIN_START = 1
const VOICE_BIN_END = 80

/** Map analyser bins → 0..1 with clear speech dynamics. */
function voiceAmplitudeFromBins(bins: Uint8Array): number {
  let sum = 0
  let peak = 0
  for (let i = VOICE_BIN_START; i < VOICE_BIN_END; i += 1) {
    const v = bins[i] / 255
    sum += v
    if (v > peak) peak = v
  }
  const avg = sum / (VOICE_BIN_END - VOICE_BIN_START)
  // Peak-weighted so consonants punch the orb; mild compress keeps soft speech visible.
  const mixed = avg * 0.4 + peak * 0.6
  return Math.min(1, Math.pow(Math.max(0, mixed), 0.55) * 1.85)
}

/** Start fetching the track this far before the section reaches the viewport. */
const WARM_MARGIN = "700px 0px"

function whenIdle(task: () => void) {
  const idle = window.requestIdleCallback
  if (idle) {
    const handle = idle(task, { timeout: 2500 })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(task, 400)
  return () => clearTimeout(handle)
}

type Phase = "idle" | "playing"

/** Layout viewport, excluding any classic scrollbar. */
function viewportBox() {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }
}

/**
 * The stage goes `position: fixed` with a high z-index, but ancestors with
 * `isolation: isolate` (the about section shell) still trap that z-index in a
 * stacking context that sits under the sticky nav (`z-50`). Lift the nearest
 * section so the fullscreen layer paints above chrome.
 */
function setExpandStacking(frame: HTMLElement, active: boolean) {
  const section = frame.closest("section")
  if (!(section instanceof HTMLElement)) return
  if (active) {
    section.style.zIndex = "100"
  } else {
    section.style.removeProperty("z-index")
  }
}

export function AboutExperience() {
  const reduceMotion = useReducedMotion()
  const isDesktop = useIsDesktop()

  const frameRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const amplitudeRef = React.useRef(0)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const binsRef = React.useRef<Uint8Array<ArrayBuffer> | null>(null)
  /** Start of the silent-fallback clock, used when no audio is playing. */
  const syntheticStartRef = React.useRef(0)

  const orbLiftRef = React.useRef<HTMLDivElement>(null)
  const captionRef = React.useRef<HTMLParagraphElement>(null)
  const progressRef = React.useRef<HTMLDivElement>(null)

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [cueIndex, setCueIndex] = React.useState(-1)
  const [expanded, setExpanded] = React.useState(false)

  // Buffer the narration before it is needed, without ever competing with the
  // page itself: nothing is fetched at load, the request waits until the
  // section is roughly a screen away, and even then it goes out at idle. The
  // file streams progressively, so playback can begin long before the last
  // byte lands.
  React.useEffect(() => {
    const frame = frameRef.current
    const audio = audioRef.current
    if (!frame || !audio) return

    let cancelIdle: (() => void) | undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()

        cancelIdle = whenIdle(() => {
          audio.preload = "auto"
          audio.load()
        })
      },
      { rootMargin: WARM_MARGIN }
    )

    observer.observe(frame)
    return () => {
      observer.disconnect()
      cancelIdle?.()
    }
  }, [])

  const stop = React.useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    amplitudeRef.current = 0
    setPhase("idle")
    setCueIndex(-1)
  }, [])

  const collapse = React.useCallback(() => {
    const stage = stageRef.current
    const frame = frameRef.current
    if (!stage || !frame) return

    ensureGsapScroll()
    const duration = reduceMotion ? 0 : LANDING_MOTION.expand * 0.8
    const rect = frame.getBoundingClientRect()
    const viewport = viewportBox()

    if (backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration })
    }

    gsap.to(stage, {
      top: rect.top,
      left: rect.left,
      right: viewport.width - rect.right,
      bottom: viewport.height - rect.bottom,
      borderRadius: 28,
      duration,
      ease: LANDING_MOTION.easeInOut,
      onComplete: () => {
        gsap.set(stage, { clearProps: "all" })
        setExpandStacking(frame, false)
        setExpanded(false)
      },
    })
  }, [reduceMotion])

  const close = React.useCallback(() => {
    stop()
    if (expanded) collapse()
  }, [collapse, expanded, stop])

  const expand = React.useCallback(() => {
    const stage = stageRef.current
    const frame = frameRef.current
    if (!stage || !frame) return

    // A leftover transform on the frame would make it the containing block for
    // the fixed stage, trapping "fullscreen" inside the card. Clear it even if
    // the entrance tween never finished.
    ensureGsapScroll()
    gsap.set(frame, { clearProps: "transform,translate,rotate,scale" })

    const rect = frame.getBoundingClientRect()
    const viewport = viewportBox()
    setExpandStacking(frame, true)
    setExpanded(true)

    // Animating all four insets (rather than width/height + vw units) keeps the
    // stage pinned to the real viewport, scrollbars and mobile chrome included.
    gsap.set(stage, {
      position: "fixed",
      top: rect.top,
      left: rect.left,
      right: viewport.width - rect.right,
      bottom: viewport.height - rect.bottom,
      width: "auto",
      height: "auto",
      borderRadius: 28,
      zIndex: 90,
    })
    gsap.to(stage, {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 0,
      duration: reduceMotion ? 0 : LANDING_MOTION.expand,
      ease: LANDING_MOTION.easeInOut,
    })
  }, [reduceMotion])

  const start = React.useCallback(() => {
    // Visual state goes first and never awaits the audio pipeline — a missing
    // or slow-failing track must not hold back the fullscreen transition.
    syntheticStartRef.current = performance.now()
    setPhase("playing")
    setCueIndex(0)
    if (isDesktop === false) expand()

    const audio = audioRef.current
    if (!audio) return

    // Keep this synchronous: Safari only honours the first playback inside the
    // user gesture. Same-origin `/media/about-narration` is WebAudio-safe.
    if (!audioContextRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (Ctor) {
        try {
          const context = new Ctor()
          const source = context.createMediaElementSource(audio)
          const analyser = context.createAnalyser()
          analyser.fftSize = 1024
          analyser.smoothingTimeConstant = 0.35
          source.connect(analyser)
          analyser.connect(context.destination)
          audioContextRef.current = context
          analyserRef.current = analyser
          binsRef.current = new Uint8Array(
            new ArrayBuffer(analyser.frequencyBinCount)
          )
        } catch {
          // Analyser is a nicety; the synthetic envelope covers the failure.
        }
      }
    }

    void audio.play().catch(() => {
      /* synthetic envelope keeps the orb alive */
    })
    void audioContextRef.current?.resume()
  }, [expand, isDesktop])

  // Drive the orb and the captions off the track's own clock.
  React.useEffect(() => {
    if (phase !== "playing") return

    let frame = 0
    const progressBar = progressRef.current

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)

      const analyser = analyserRef.current
      const bins = binsRef.current
      const audio = audioRef.current
      const live = Boolean(audio && !audio.paused && !audio.ended)
      const analysing = live && analyser && bins

      if (analysing) {
        analyser.getByteFrequencyData(bins)
        amplitudeRef.current = voiceAmplitudeFromBins(bins)
      } else if (audio && live && !reduceMotion) {
        // Audio playing but analyser missing — speech-shaped fallback.
        const t = audio.currentTime
        const envelope =
          0.32 +
          0.22 * Math.sin(t * 6.2) +
          0.14 * Math.sin(t * 13.1 + 1.1) +
          0.1 * Math.sin(t * 27.4 + 2.4)
        amplitudeRef.current = Math.max(0, Math.min(1, envelope))
      } else if (!reduceMotion) {
        const t = (now - syntheticStartRef.current) / 1000
        const envelope =
          0.3 +
          0.16 * Math.sin(t * 5.1) +
          0.1 * Math.sin(t * 11.7 + 1.1)
        amplitudeRef.current = Math.max(0, Math.min(1, envelope))
      }

      const time =
        audio && live
          ? audio.currentTime
          : (now - syntheticStartRef.current) / 1000

      const next = cueIndexAt(time)
      setCueIndex((current) => (current === next ? current : next))
      if (progressBar) {
        progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, time / ABOUT_NARRATION_DURATION))})`
      }

      if (time >= ABOUT_NARRATION_DURATION) close()
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      amplitudeRef.current = 0
      if (progressBar) progressBar.style.transform = "scaleX(0)"
    }
  }, [close, phase, reduceMotion])

  // Fade the backdrop in behind the stage as it grows.
  React.useEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop) return
    ensureGsapScroll()
    gsap.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: reduceMotion ? 0 : LANDING_MOTION.expand * 0.6 }
    )
  }, [expanded, reduceMotion])

  React.useEffect(() => {
    const el = orbLiftRef.current
    if (!el) return
    ensureGsapScroll()
    const playing = phase === "playing"
    gsap.to(el, {
      yPercent: playing ? (expanded ? -4 : -7) : 0,
      scale: playing ? (expanded ? 0.92 : 0.88) : 1,
      duration: reduceMotion ? 0 : LANDING_MOTION.duration,
      ease: LANDING_MOTION.ease,
      overwrite: true,
    })
  }, [phase, expanded, reduceMotion])

  React.useEffect(() => {
    const el = captionRef.current
    if (!el || phase !== "playing") return
    ensureGsapScroll()
    if (reduceMotion) {
      gsap.set(el, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: LANDING_MOTION.durationFast,
        ease: LANDING_MOTION.ease,
      }
    )
  }, [cueIndex, phase, reduceMotion])

  // Escape closes, and the page must not scroll behind the fullscreen stage.
  React.useEffect(() => {
    if (!expanded) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)

    // iOS Safari ignores `overflow: hidden` on body, so pin it instead and
    // restore the scroll offset on the way out.
    const { body } = document
    const scrollY = window.scrollY
    const previous = body.style.cssText
    const frame = frameRef.current
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.overflow = "hidden"

    return () => {
      body.style.cssText = previous
      window.scrollTo(0, scrollY)
      window.removeEventListener("keydown", onKey)
      if (frame) setExpandStacking(frame, false)
    }
  }, [close, expanded])

  const activeCue = cueIndex >= 0 ? ABOUT_NARRATION_CUES[cueIndex] : null

  return (
    <div
      ref={frameRef}
      className="relative aspect-video w-full rounded-[1.75rem] bg-muted"
    >
      {expanded && (
        <div
          ref={backdropRef}
          aria-hidden
          className="fixed inset-0 z-[89] bg-background"
        />
      )}

      <div
        ref={stageRef}
        className={cn(
          landingGlassSurface,
          "absolute inset-0 rounded-[1.75rem] bg-white/42 dark:bg-white/8",
          expanded && "rounded-none bg-background dark:bg-background"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            expanded
              ? "bg-[radial-gradient(ellipse_at_50%_38%,rgba(186,230,253,0.55)_0%,rgba(239,246,255,0.92)_34%,#f1f5f9_100%)] dark:bg-[radial-gradient(ellipse_at_50%_38%,rgba(37,99,235,0.28)_0%,oklch(0.18_0_0)_48%,oklch(0.12_0_0)_100%)]"
              : "bg-[radial-gradient(ellipse_at_50%_42%,#ffffff_0%,#f6f7f9_58%,#eef1f5_100%)] dark:bg-[radial-gradient(ellipse_at_50%_42%,oklch(0.28_0_0)_0%,oklch(0.22_0_0)_58%,oklch(0.18_0_0)_100%)]"
          )}
        />
        {expanded ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.4)_0%,transparent_40%)] dark:bg-[radial-gradient(circle_at_50%_46%,rgba(125,211,252,0.16)_0%,transparent_46%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30 [background-image:radial-gradient(rgba(37,99,235,0.12)_1px,transparent_1px)] [background-size:28px_28px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
            />
          </>
        ) : null}
        <span
          aria-hidden
          className={cn(
            landingGlassSheen,
            "absolute inset-0",
            expanded && "opacity-50"
          )}
        />

        <div
          ref={orbLiftRef}
          className={cn(
            "relative z-10 size-full",
            expanded &&
              "[&_canvas]:drop-shadow-[0_24px_80px_rgba(37,99,235,0.18)]"
          )}
        >
          <AboutOrbCanvas
            amplitudeRef={amplitudeRef}
            still={Boolean(reduceMotion)}
            immersive={expanded}
            className="size-full"
          />
        </div>

        {phase === "idle" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <Button
              type="button"
              onClick={start}
              aria-label="Hear from Exur"
              className="group size-16 rounded-full bg-[#2563EB] text-white shadow-[0_12px_40px_rgba(37,99,235,0.34)] transition-all hover:bg-[#1D4ED8] hover:shadow-[0_16px_48px_rgba(37,99,235,0.42)] sm:size-18"
            >
              <PlayIcon className="size-6 translate-x-px fill-current sm:size-7" />
            </Button>
          </div>
        )}

        {phase === "playing" && (
          <>
            {expanded ? (
              <p className="pointer-events-none absolute top-5 left-1/2 z-20 -translate-x-1/2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground/80 uppercase">
                Exur
              </p>
            ) : null}

            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-background via-background/88 to-transparent px-6 sm:px-10",
                expanded ? "pt-32 pb-[max(7rem,env(safe-area-inset-bottom))]" : "pt-24 pb-28 sm:pb-36"
              )}
            >
              <p
                ref={captionRef}
                key={cueIndex}
                className={cn(
                  landingTitleQuote,
                  "mx-auto text-center",
                  expanded ? "max-w-xl text-[1.35rem] leading-snug sm:text-[1.5rem]" : "max-w-2xl"
                )}
              >
                {activeCue?.text ?? ""}
              </p>
            </div>

            <div
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 z-30 h-1 overflow-hidden bg-foreground/5",
                !expanded && "rounded-b-[1.75rem]"
              )}
            >
              <div
                ref={progressRef}
                className="h-full w-full origin-left bg-[#2563EB] will-change-transform"
                style={{ transform: "scaleX(0)" }}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close"
              className={cn(
                landingGlassNavIcon,
                "absolute top-4 right-4 z-30 text-muted-foreground hover:text-foreground",
                expanded && "top-[max(1rem,env(safe-area-inset-top))]"
              )}
            >
              <XIcon className="size-5" />
            </Button>
          </>
        )}
      </div>

      {/* Same-origin `/media/about-narration` — WebAudio-safe. */}
      <audio ref={audioRef} src={ABOUT_NARRATION_SRC} preload="none" />
    </div>
  )
}
