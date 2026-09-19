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
  ABOUT_NARRATION_ORIGIN,
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
const VOICE_BIN_START = 2
const VOICE_BIN_END = 48

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

/**
 * Can WebAudio read this file?
 *
 * A cross-origin track served without `Access-Control-Allow-Origin` still
 * plays, but routing it through an AnalyserNode makes the graph output
 * silence — so we must know before wiring the analyser, not after. One
 * single-byte ranged request answers it.
 */
async function isReadableByWebAudio(src: string): Promise<boolean> {
  if (new URL(src, window.location.href).origin === window.location.origin) {
    return true
  }
  try {
    const response = await fetch(src, {
      method: "GET",
      mode: "cors",
      headers: { Range: "bytes=0-0" },
    })
    return response.ok
  } catch {
    return false
  }
}

type Phase = "idle" | "playing"

/** Layout viewport, excluding any classic scrollbar. */
function viewportBox() {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
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
  const hasAudioRef = React.useRef(false)
  /** null until the CORS probe answers; only `true` may reach the analyser. */
  const analyserAllowedRef = React.useRef<boolean | null>(null)

  const orbLiftRef = React.useRef<HTMLDivElement>(null)
  const captionRef = React.useRef<HTMLParagraphElement>(null)

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
          void isReadableByWebAudio(ABOUT_NARRATION_SRC).then((allowed) => {
            analyserAllowedRef.current = allowed
            // Must be set before the element loads, or it would need a reload.
            if (allowed) audio.crossOrigin = "anonymous"
            audio.preload = "auto"
            audio.load()
          })
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

    // Everything below must stay synchronous: Safari only honours the first
    // playback if it starts inside the user gesture, and any `await` ends it.
    //
    // Skip the analyser unless the probe cleared it. Wiring a CORS-blocked
    // element into WebAudio would silence the narration outright, so an
    // unreactive orb is the far cheaper failure.
    if (analyserAllowedRef.current && !audioContextRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (Ctor) {
        try {
          const context = new Ctor()
          const source = context.createMediaElementSource(audio)
          const analyser = context.createAnalyser()
          analyser.fftSize = 512
          analyser.smoothingTimeConstant = 0.72
          source.connect(analyser)
          analyser.connect(context.destination)
          audioContextRef.current = context
          analyserRef.current = analyser
          binsRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
        } catch {
          // Analyser is a nicety; the synthetic envelope covers the failure.
        }
      }
    }

    const playback = audio.play()
    void audioContextRef.current?.resume()
    playback
      ?.then(() => {
        hasAudioRef.current = true
      })
      .catch(() => {
        hasAudioRef.current = false
      })
  }, [expand, isDesktop])

  // Drive the orb and the captions off the track's own clock.
  React.useEffect(() => {
    if (phase !== "playing") return

    let frame = 0

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)

      const analyser = analyserRef.current
      const bins = binsRef.current
      const audio = audioRef.current
      const live = hasAudioRef.current && audio && !audio.paused

      if (live && analyser && bins) {
        analyser.getByteFrequencyData(bins)
        let sum = 0
        for (let i = VOICE_BIN_START; i < VOICE_BIN_END; i += 1) sum += bins[i]
        amplitudeRef.current = sum / (VOICE_BIN_END - VOICE_BIN_START) / 255
      } else if (!reduceMotion) {
        // Track missing or blocked — keep the orb alive on a speech-ish envelope.
        const t = (now - syntheticStartRef.current) / 1000
        const envelope =
          0.26 +
          0.13 * Math.sin(t * 5.1) +
          0.09 * Math.sin(t * 11.7 + 1.1) +
          0.06 * Math.sin(t * 23.3 + 2.4)
        amplitudeRef.current = Math.max(0, Math.min(1, envelope))
      }

      // Captions follow real playback position, so they stay in sync even if
      // the track buffers. The wall clock only stands in when there's no audio.
      const time = live
        ? audio.currentTime
        : (now - syntheticStartRef.current) / 1000

      const next = cueIndexAt(time)
      setCueIndex((current) => (current === next ? current : next))

      if (time >= ABOUT_NARRATION_DURATION) close()
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      amplitudeRef.current = 0
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
    gsap.to(el, {
      yPercent: phase === "playing" ? -7 : 0,
      scale: phase === "playing" ? 0.88 : 1,
      duration: reduceMotion ? 0 : LANDING_MOTION.duration,
      ease: LANDING_MOTION.ease,
      overwrite: true,
    })
  }, [phase, reduceMotion])

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
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.overflow = "hidden"

    return () => {
      body.style.cssText = previous
      window.scrollTo(0, scrollY)
      window.removeEventListener("keydown", onKey)
    }
  }, [close, expanded])

  const activeCue = cueIndex >= 0 ? ABOUT_NARRATION_CUES[cueIndex] : null

  return (
    <div
      ref={frameRef}
      className="relative aspect-video w-full rounded-[1.75rem] bg-[#F1F5F9]"
    >
      {expanded && (
        <div ref={backdropRef} aria-hidden className="fixed inset-0 z-[89] bg-[#F8FAFC]" />
      )}

      <div
        ref={stageRef}
        className={cn(
          landingGlassSurface,
          "absolute inset-0 rounded-[1.75rem] bg-white/42"
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#ffffff_0%,#f6f7f9_58%,#eef1f5_100%)]"
        />
        <span aria-hidden className={cn(landingGlassSheen, "absolute inset-0")} />

        <div ref={orbLiftRef} className="relative z-10 size-full">
          <AboutOrbCanvas
            amplitudeRef={amplitudeRef}
            still={Boolean(reduceMotion)}
            className="size-full"
          />
        </div>

          {phase === "idle" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              {/* A media frame gets a play affordance, not a text pill parked
                  over the artwork. */}
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-[#F8FAFC] via-[#F8FAFC]/85 to-transparent px-6 pt-20 pb-8 sm:px-10 sm:pb-12">
              <p
                ref={captionRef}
                key={cueIndex}
                className={cn(landingTitleQuote, "mx-auto max-w-2xl text-center")}
              >
                {activeCue?.text ?? ""}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close"
              className={cn(
                landingGlassNavIcon,
                "absolute top-4 right-4 z-30 text-[#475569] hover:text-[#0F172A]"
              )}
            >
              <XIcon className="size-5" />
            </Button>
          </>
        )}
      </div>

      {/* React hoists this: the CDN handshake is done by the time we ask for
          bytes, but no audio is downloaded until the warm-up effect says so. */}
      <link rel="preconnect" href={ABOUT_NARRATION_ORIGIN} crossOrigin="anonymous" />

      {/* `preload` and `crossOrigin` are raised later, by the warm-up effect. */}
      <audio ref={audioRef} src={ABOUT_NARRATION_SRC} preload="none" />
    </div>
  )
}
