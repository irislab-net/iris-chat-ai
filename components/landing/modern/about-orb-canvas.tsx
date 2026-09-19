"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Point-cloud sphere rendered on a 2D canvas.
 *
 * Points sit on a Fibonacci sphere, so their projected density peaks at the
 * limb — that alone gives the bright rim. Amplitude (0..1, supplied by the
 * caller from a WebAudio analyser) pushes points along their normal, so the
 * surface ripples with the voice instead of just scaling.
 */

const POINT_COUNT = 3200
/** Perspective depth in unit-sphere radii. Larger = flatter. */
const FOV = 3.4
/** Landing ink — same slate the goals story illustration uses. */
const INK_RGB = [15, 23, 42] as const
/** Lighter ink for compact tiles — dense rim dots otherwise read as a harsh black ring. */
const INK_RGB_COMPACT = [100, 116, 139] as const
/** Brand blue — only the specular hotspot reaches it. */
const GLINT_RGB = [37, 99, 235] as const
const GLINT_RGB_COMPACT = [96, 165, 250] as const

/** Below this width the orb sits in a small aspect-video tile (mobile). */
const COMPACT_WIDTH = 480

/**
 * Key light, in view space. Upper-left and slightly toward the camera, which is
 * where a viewer expects a highlight to sit on a sphere.
 */
const LIGHT = (() => {
  const [x, y, z] = [-0.5, -0.62, 0.6]
  const length = Math.hypot(x, y, z)
  return { x: x / length, y: y / length, z: z / length }
})()

/**
 * Ink → blue ramp, precomputed.
 *
 * Building an `rgb()` string per point per frame would allocate ~3200 strings
 * every frame; a 24-step lookup is visually identical and allocation-free.
 */
const PALETTE_STEPS = 24

function buildPalette(
  ink: readonly [number, number, number],
  glint: readonly [number, number, number]
) {
  return Array.from({ length: PALETTE_STEPS }, (_, i) => {
    const t = i / (PALETTE_STEPS - 1)
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
    return `rgb(${mix(ink[0], glint[0])},${mix(ink[1], glint[1])},${mix(ink[2], glint[2])})`
  })
}

const PALETTE = buildPalette(INK_RGB, GLINT_RGB)
const PALETTE_COMPACT = buildPalette(INK_RGB_COMPACT, GLINT_RGB_COMPACT)
/** Light ink on the dark tile so the rim still reads. */
const PALETTE_DARK = buildPalette([226, 232, 240], GLINT_RGB_COMPACT)
const PALETTE_DARK_COMPACT = buildPalette([148, 163, 184], GLINT_RGB_COMPACT)

type UnitPoint = { x: number; y: number; z: number }

function fibonacciSphere(count: number): UnitPoint[] {
  const points: UnitPoint[] = new Array(count)
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2
    const ring = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points[i] = { x: Math.cos(theta) * ring, y, z: Math.sin(theta) * ring }
  }

  return points
}

/** Cheap smooth pseudo-noise in [-1, 1]; no gradient-noise dependency. */
function ripple(p: UnitPoint, t: number): number {
  return (
    Math.sin(p.x * 3.1 + t * 1.7) *
    Math.cos(p.y * 2.7 - t * 1.3) *
    Math.sin(p.z * 3.3 + t * 0.9)
  )
}

type AboutOrbCanvasProps = {
  /** Live voice amplitude, 0..1. */
  amplitudeRef: React.RefObject<number>
  /** Freeze rotation and displacement for reduced-motion users. */
  still?: boolean
  className?: string
}

function readDocumentDark() {
  return document.documentElement.classList.contains("dark")
}

export function AboutOrbCanvas({
  amplitudeRef,
  still = false,
  className,
}: AboutOrbCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const darkRef = React.useRef(false)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const points = fibonacciSphere(POINT_COUNT)
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const compact = width < COMPACT_WIDTH
      dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    darkRef.current = readDocumentDark()
    const themeObserver = new MutationObserver(() => {
      darkRef.current = readDocumentDark()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    let frame = 0
    const start = performance.now()
    let smoothed = 0

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)

      const t = still ? 0 : (now - start) / 1000
      const target = still ? 0 : Math.min(1, Math.max(0, amplitudeRef.current))
      // Fast attack, slow release reads as a voice rather than a meter.
      smoothed += (target - smoothed) * (target > smoothed ? 0.35 : 0.08)

      const compact = width < COMPACT_WIDTH
      const cx = width / 2
      const cy = height / 2
      const baseRadius = Math.min(width, height) * 0.3 * (1 + smoothed * 0.05)
      const dark = darkRef.current
      const palette = dark
        ? compact
          ? PALETTE_DARK_COMPACT
          : PALETTE_DARK
        : compact
          ? PALETTE_COMPACT
          : PALETTE
      const rimWeight = compact ? 0.44 : 0.78
      const rimAlphaBase = compact ? 0.04 : 0.08
      const dotBase = compact ? 0.32 : 0.5
      const dotRimScale = compact ? 0.42 : 0.85
      const shadeFloor = compact ? 0.62 : 0.5
      const pointStep = compact ? 2 : 1

      context.clearRect(0, 0, width, height)
      if (compact) context.filter = "blur(0.85px)"

      const spinY = t * 0.22
      const cosY = Math.cos(spinY)
      const sinY = Math.sin(spinY)
      const tilt = 0.32
      const cosX = Math.cos(tilt)
      const sinX = Math.sin(tilt)

      for (let i = 0; i < points.length; i += pointStep) {
        const p = points[i]

        const displaced = 1 + smoothed * 0.17 * ripple(p, t)
        const px = p.x * displaced
        const py = p.y * displaced
        const pz = p.z * displaced

        // Yaw, then a fixed tilt so the pole never sits dead centre.
        const rx = px * cosY + pz * sinY
        const rzY = pz * cosY - px * sinY
        const ry = py * cosX - rzY * sinX
        const rz = py * sinX + rzY * cosX

        const scale = FOV / (FOV + rz)
        const sx = cx + rx * baseRadius * scale
        const sy = cy + ry * baseRadius * scale

        // Densest and darkest at the limb (rz ≈ 0), fading through the centre,
        // so the silhouette stays crisp on the light tile.
        const rim = 1 - Math.abs(rz)

        // Surface normal — the rotated point itself, undone by its displacement.
        const inv = 1 / displaced
        const lambert = Math.max(
          0,
          rx * inv * LIGHT.x + ry * inv * LIGHT.y + rz * inv * LIGHT.z
        )
        // Tight exponent keeps the highlight a glint rather than a wash.
        const spec = lambert * lambert * lambert * lambert * lambert * lambert

        // On a near-white tile a lit facet reads as *less* ink, so the key side
        // drops out and the terminator carries the weight.
        const shade = shadeFloor + (1 - shadeFloor) * (1 - lambert)
        const alpha =
          ((rimAlphaBase + rimWeight * rim * rim) * shade + spec * (compact ? 0.42 : 0.55)) *
          (compact ? 0.62 : 0.78 + smoothed * 0.45)
        const dot =
          (dotBase + dotRimScale * scale * rim) *
          (1 + spec * (compact ? 0.45 : 0.7)) *
          (1 + smoothed * (compact ? 0.12 : 0.25))

        context.globalAlpha = Math.min(1, alpha)
        context.fillStyle = palette[Math.round(spec * (PALETTE_STEPS - 1))]
        context.beginPath()
        context.arc(sx, sy, dot, 0, Math.PI * 2)
        context.fill()
      }

      context.filter = "none"
      context.globalAlpha = 1
    }

    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
    }
  }, [amplitudeRef, still])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("block size-full", className)}
    />
  )
}
