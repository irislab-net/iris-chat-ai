"use client"

import { gsap } from "gsap"
import { PlayIcon, XIcon } from "lucide-react"
import * as React from "react"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { AboutOrbCanvas } from "@/components/landing/modern/about-orb-canvas"
import { Button } from "@/components/ui/button"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  ABOUT_NARRATION_CDN,
  ABOUT_NARRATION_CUES,
  ABOUT_NARRATION_DURATION,
  ABOUT_NARRATION_SRC,
  cueIndexAt,
} from "@/lib/about-narration"
import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_MOTION, useReducedMotion } from "@/lib/landing-motion"
import {
  landingDisplay,
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
  /** Set for the whole narration so a late warm-up reload cannot abort `play()`. */
  const playbackRequestedRef = React.useRef(false)
  /**
   * Same-origin proxy is required for WebAudio analysis (CDN has no CORS).
   * If the proxy errors, fall back to the CDN for audible playback and skip
   * MediaElementSource — creating it on a non-CORS cross-origin element
   * routes silence to the destination and the orb goes mute.
   */
  const useCdnFallbackRef = React.useRef(false)
  /** Body scroll lock applied for the fullscreen stage. Idempotent. */
  const scrollLockRef = React.useRef<{
    scrollY: number
    previous: string
  } | null>(null)

  const orbLiftRef = React.useRef<HTMLDivElement>(null)
  const captionRef = React.useRef<HTMLParagraphElement>(null)
  const progressRef = React.useRef<HTMLDivElement>(null)

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [cueIndex, setCueIndex] = React.useState(-1)
  const [expanded, setExpanded] = React.useState(false)

  const fallBackToCdn = React.useCallback((audio: HTMLAudioElement) => {
    if (useCdnFallbackRef.current) return
    useCdnFallbackRef.current = true
    audio.src = ABOUT_NARRATION_CDN
  }, [])

  // Buffer the narration before it is needed, without ever competing with the
  // page itself: nothing is fetched at load, the request waits until the
  // section is roughly a screen away, and even then it goes out at idle. The
  // file streams progressively, so playback can begin long before the last
  // byte lands. If the same-origin proxy is down, switch to the CDN before
  // the user taps so the gesture-bound `play()` still has a reachable src.
  React.useEffect(() => {
    const frame = frameRef.current
    const audio = audioRef.current
    if (!frame || !audio) return

    let cancelIdle: (() => void) | undefined

    const onError = () => {
      // Once MediaElementSource owns the element we cannot flip to the CDN
      // without muting (no CORS on the CDN).
      if (audioContextRef.current) return
      fallBackToCdn(audio)
      if (playbackRequestedRef.current) {
        void audio.play().catch(() => {
          /* synthetic envelope keeps the orb alive */
        })
        return
      }
      if (!audio.paused || audio.currentTime > 0) return
      audio.preload = "auto"
      audio.load()
    }
    audio.addEventListener("error", onError)

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()

        cancelIdle = whenIdle(() => {
          // `load()` aborts any in-flight play, and the replacement is no
          // longer covered by the user gesture — so a tap that wins this race
          // (typical on the fullscreen mobile path) goes silent.
          if (playbackRequestedRef.current) return
          if (!audio.paused || audio.currentTime > 0) return
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
      audio.removeEventListener("error", onError)
    }
  }, [fallBackToCdn])

  const stop = React.useCallback(() => {
    playbackRequestedRef.current = false
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    amplitudeRef.current = 0
    setPhase("idle")
    setCueIndex(-1)
  }, [])

  const lockPageScroll = React.useCallback(() => {
    if (scrollLockRef.current) return
    const { body } = document
    const scrollY = window.scrollY
    scrollLockRef.current = { scrollY, previous: body.style.cssText }
    // iOS Safari ignores `overflow: hidden` on body, so pin it instead.
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.overflow = "hidden"
  }, [])

  const unlockPageScroll = React.useCallback(() => {
    const lock = scrollLockRef.current
    if (!lock) return
    scrollLockRef.current = null
    document.body.style.cssText = lock.previous
    window.scrollTo(0, lock.scrollY)
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
    if (!stage || !frame) return false

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
    return true
  }, [reduceMotion])

  const start = React.useCallback(() => {
    // Visual state goes first and never awaits the audio pipeline — a missing
    // or slow-failing track must not hold back the fullscreen transition.
    playbackRequestedRef.current = true
    syntheticStartRef.current = performance.now()
    setPhase("playing")
    setCueIndex(0)
    if (isDesktop === false && expand()) {
      // Pin the page before `play()`. The fullscreen path is the only one that
      // locks scroll; doing it in an effect (after this gesture) makes the
      // browser abort the in-flight playback, and a retry is no longer allowed
      // to start audio. Desktop never locks, so only the fullscreen orb was silent.
      lockPageScroll()
    }

    const audio = audioRef.current
    if (!audio) return

    // Keep play() synchronous with the user gesture (Safari). Wire WebAudio
    // only after a successful same-origin start — MediaElementSource on the
    // non-CORS CDN element would output silence to the destination.
    const attachAnalyser = () => {
      if (useCdnFallbackRef.current || audioContextRef.current) return
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return
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

    const resumeContext = () => {
      const context = audioContextRef.current
      if (context && context.state !== "running") void context.resume()
    }

    const beginPlayback = () => {
      if (!playbackRequestedRef.current) return
      if (!(audio.paused && !audio.ended)) {
        if (!useCdnFallbackRef.current) attachAnalyser()
        resumeContext()
        return
      }
      void audio
        .play()
        .then(() => {
          if (!useCdnFallbackRef.current) attachAnalyser()
          resumeContext()
        })
        .catch(() => {
          // Proxy may 500 before the warm-up error handler runs. Flip to the
          // CDN for a second attempt; Chrome still counts this as the gesture
          // chain, Safari may not — warm-up fallback covers the common path.
          if (!useCdnFallbackRef.current) {
            fallBackToCdn(audio)
            void audio.play().catch(() => {
              /* synthetic envelope keeps the orb alive */
            })
          }
        })
    }
    beginPlayback()
    // A scroll-lock that already ran can pause the element before the click
    // task yields. A microtask is still inside the user gesture; a later effect is not.
    queueMicrotask(beginPlayback)
  }, [expand, fallBackToCdn, isDesktop, lockPageScroll])

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

  // Keep Escape on the latest `close` without writing a ref during render.
  const onEscapeClose = React.useEffectEvent(() => {
    close()
  })

  // Escape closes the fullscreen stage. Scroll is locked inside the play
  // gesture (see `start`); this effect only listens for Escape and restores
  // the page on the way out. Pinning `body` again here would abort playback.
  React.useEffect(() => {
    if (!expanded) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscapeClose()
    }
    window.addEventListener("keydown", onKey)

    const frame = frameRef.current
    return () => {
      window.removeEventListener("keydown", onKey)
      unlockPageScroll()
      if (frame) setExpandStacking(frame, false)
    }
  }, [expanded, unlockPageScroll])

  const activeCue = cueIndex >= 0 ? ABOUT_NARRATION_CUES[cueIndex] : null

  return (
    <div
      ref={frameRef}
      className="relative aspect-video w-full rounded-[1.75rem] bg-muted"
    >
      {expanded ? (
        <div
          key="about-backdrop"
          ref={backdropRef}
          aria-hidden
          className="fixed inset-0 z-[89] bg-background"
        />
      ) : null}

      <div
        key="about-stage"
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
              ? "bg-[radial-gradient(ellipse_at_50%_36%,rgba(186,230,253,0.58)_0%,rgba(239,246,255,0.9)_32%,#eef2f7_72%,#e8eef5_100%)] dark:bg-[radial-gradient(ellipse_at_50%_36%,rgba(37,99,235,0.32)_0%,oklch(0.17_0_0)_46%,oklch(0.11_0_0)_100%)]"
              : "bg-[radial-gradient(ellipse_at_50%_40%,#ffffff_0%,#f7f8fa_52%,#eef1f5_100%)] dark:bg-[radial-gradient(ellipse_at_50%_40%,oklch(0.29_0_0)_0%,oklch(0.22_0_0)_58%,oklch(0.17_0_0)_100%)]"
          )}
        />
        {expanded ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.55)_0%,transparent_42%)] dark:bg-[radial-gradient(circle_at_50%_44%,rgba(125,211,252,0.18)_0%,transparent_48%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25 [background-image:radial-gradient(rgba(37,99,235,0.14)_1px,transparent_1px)] [background-size:26px_26px] mask-[radial-gradient(ellipse_at_center,black_18%,transparent_68%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-linear-to-t from-background/80 via-background/25 to-transparent dark:from-background/90"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-linear-to-t from-white/70 via-white/20 to-transparent dark:from-black/35 dark:via-black/10"
          />
        )}
        <span
          aria-hidden
          className={cn(
            landingGlassSheen,
            "absolute inset-0",
            expanded && "opacity-45"
          )}
        />

        <div
          ref={orbLiftRef}
          className={cn(
            "relative z-10 size-full",
            expanded &&
              "[&_canvas]:drop-shadow-[0_28px_90px_rgba(37,99,235,0.22)]"
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5">
            <div className="relative flex items-center justify-center">
              {!reduceMotion ? (
                <>
                  <span
                    aria-hidden
                    className="about-play-ring pointer-events-none absolute size-[5.25rem] rounded-full border border-[#2563EB]/22 sm:size-[5.75rem]"
                  />
                  <span
                    aria-hidden
                    className="about-play-ring-delayed pointer-events-none absolute size-[6.5rem] rounded-full border border-[#2563EB]/12 sm:size-[7rem]"
                  />
                </>
              ) : null}
              <Button
                type="button"
                onClick={start}
                aria-label="Hear from Exur"
                className={cn(
                  "group relative size-16 rounded-full bg-[#2563EB] text-white",
                  "shadow-[0_12px_40px_rgba(37,99,235,0.34),inset_0_1px_1px_rgba(255,255,255,0.35)]",
                  "transition-all hover:bg-[#1D4ED8] hover:shadow-[0_16px_48px_rgba(37,99,235,0.45)]",
                  "sm:size-18"
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/25 to-transparent opacity-80"
                />
                <PlayIcon className="relative size-6 translate-x-px fill-current sm:size-7" />
              </Button>
            </div>
            <p
              className={cn(
                landingDisplay,
                "text-sm font-normal tracking-[-0.01em] text-muted-foreground/90 sm:text-[0.95rem]"
              )}
            >
              Hear from Exur
            </p>
          </div>
        )}

        {phase === "playing" && (
          <>
            {expanded ? (
              <div className="pointer-events-none absolute top-[max(1.15rem,env(safe-area-inset-top))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
                <IrisLabLogo
                  decorative
                  variant="brand"
                  size={22}
                  className="size-[1.35rem] opacity-90"
                />
                <span
                  className={cn(
                    landingDisplay,
                    "text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground/85 uppercase"
                  )}
                >
                  Exur
                </span>
              </div>
            ) : null}

            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 sm:px-10",
                expanded
                  ? "pt-28 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+3.75rem))]"
                  : "pt-20 pb-16 sm:pb-20"
              )}
            >
              <div className="mx-auto max-w-2xl">
                <p
                  ref={captionRef}
                  key={cueIndex}
                  className={cn(
                    landingTitleQuote,
                    "text-center text-balance",
                    expanded
                      ? "max-w-xl mx-auto text-[1.4rem] leading-[1.35] tracking-[-0.02em] sm:text-[1.65rem]"
                      : "text-[1.05rem] leading-snug sm:text-xl"
                  )}
                >
                  {activeCue?.text ?? ""}
                </p>
              </div>
            </div>

            <div
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 z-30 flex justify-center px-6 sm:px-10",
                expanded
                  ? "pb-[max(1.35rem,env(safe-area-inset-bottom))]"
                  : "pb-4 sm:pb-5"
              )}
            >
              <div
                className={cn(
                  "relative h-[3px] w-full max-w-sm overflow-hidden rounded-full sm:h-1 sm:max-w-md",
                  "bg-foreground/[0.07] shadow-[inset_0_1px_1px_rgba(15,23,42,0.05)]",
                  "backdrop-blur-[2px] dark:bg-white/[0.1] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
                )}
              >
                <div
                  ref={progressRef}
                  className="about-narration-progress relative h-full w-full origin-left will-change-transform"
                  style={{ transform: "scaleX(0)" }}
                >
                  <span className="absolute inset-0 rounded-full bg-linear-to-r from-[#93C5FD] via-[#2563EB] to-[#1D4ED8]" />
                  <span className="absolute inset-y-0 right-0 w-8 rounded-full bg-linear-to-r from-transparent to-white/50 dark:to-white/35" />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Close"
              className={cn(
                landingGlassNavIcon,
                "absolute top-4 right-4 z-30 text-muted-foreground hover:text-foreground",
                expanded && "top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]"
              )}
            >
              <XIcon className="size-5" />
            </Button>
          </>
        )}
      </div>

      {/* Keyed so the fullscreen backdrop cannot remount this node.
          `play()` is tied to the element that received the user gesture. */}
      <audio
        key="about-narration"
        ref={audioRef}
        src={ABOUT_NARRATION_SRC}
        preload="none"
      />
    </div>
  )
}
