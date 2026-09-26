"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Liquid-glass AI orb — Fibonacci point cloud + glass body.
 * Voice amplitude drives breath, glow, and spin with liquid smoothing.
 *
 * Kept cheap on the main thread: fewer points, no canvas filter blur,
 * pause off-screen, and throttle when idle.
 */

const POINT_COUNT = 1100
const FOV = 3.25
const INK_RGB = [15, 23, 42] as const
const INK_RGB_COMPACT = [71, 85, 105] as const
const GLINT_RGB = [56, 189, 248] as const
const GLINT_RGB_HOT = [125, 211, 252] as const
const COMPACT_WIDTH = 480
/** Idle / preview: ~24fps. Playing: uncapped rAF. */
const IDLE_FRAME_MS = 1000 / 24

const LIGHT = (() => {
  const [x, y, z] = [-0.4, -0.68, 0.62]
  const length = Math.hypot(x, y, z)
  return { x: x / length, y: y / length, z: z / length }
})()

const PALETTE_STEPS = 28

function buildPalette(
  ink: readonly [number, number, number],
  glint: readonly [number, number, number]
) {
  return Array.from({ length: PALETTE_STEPS }, (_, i) => {
    const t = i / (PALETTE_STEPS - 1)
    const e = t * t * (3 - 2 * t)
    const mix = (a: number, b: number) => Math.round(a + (b - a) * e)
    return `rgb(${mix(ink[0], glint[0])},${mix(ink[1], glint[1])},${mix(ink[2], glint[2])})`
  })
}

const PALETTE = buildPalette(INK_RGB, GLINT_RGB)
const PALETTE_COMPACT = buildPalette(INK_RGB_COMPACT, GLINT_RGB)
const PALETTE_DARK = buildPalette([186, 230, 253], GLINT_RGB_HOT)
const PALETTE_DARK_COMPACT = buildPalette([125, 211, 252], GLINT_RGB)

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

function swell(p: UnitPoint, t: number): number {
  return (
    Math.sin(p.x * 2.1 + t * 1.15) * 0.4 +
    Math.cos(p.y * 2.4 - t * 0.95) * 0.35 +
    Math.sin(p.z * 1.8 + t * 0.75) * 0.25
  )
}

function micro(p: UnitPoint, t: number): number {
  return Math.sin(p.x * 5.2 + t * 2.8) * Math.cos(p.y * 4.6 - t * 2.1)
}

type AboutOrbCanvasProps = {
  amplitudeRef: React.RefObject<number>
  still?: boolean
  /** When false, spin slowly at low FPS (idle preview). */
  active?: boolean
  immersive?: boolean
  className?: string
}

function readDocumentDark() {
  return document.documentElement.classList.contains("dark")
}

export function AboutOrbCanvas({
  amplitudeRef,
  still = false,
  active = false,
  immersive = false,
  className,
}: AboutOrbCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const darkRef = React.useRef(false)
  const immersiveRef = React.useRef(immersive)
  const activeRef = React.useRef(active)
  const stillRef = React.useRef(still)

  React.useEffect(() => {
    immersiveRef.current = immersive
  }, [immersive])

  React.useEffect(() => {
    activeRef.current = active
  }, [active])

  React.useEffect(() => {
    stillRef.current = still
  }, [still])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d", { alpha: true })
    if (!context) return

    const points = fibonacciSphere(POINT_COUNT)
    let width = 0
    let height = 0
    let dpr = 1
    let visible = true
    let frame = 0
    let lastPaint = 0
    const start = performance.now()
    let smoothed = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const useCompact = !immersiveRef.current && width < COMPACT_WIDTH
      dpr = Math.min(window.devicePixelRatio || 1, useCompact ? 1.25 : 1.75)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting)
        if (visible) {
          lastPaint = 0
          frame = requestAnimationFrame(draw)
        } else if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
      },
      { rootMargin: "80px", threshold: 0.01 }
    )
    visibilityObserver.observe(canvas)

    darkRef.current = readDocumentDark()
    const themeObserver = new MutationObserver(() => {
      darkRef.current = readDocumentDark()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const paint = (now: number) => {
      const isStill = stillRef.current
      const isActive = activeRef.current && !isStill
      const t = isStill ? 0 : (now - start) / 1000
      const target = isStill
        ? 0
        : Math.min(1, Math.max(0, amplitudeRef.current))
      smoothed += (target - smoothed) * (target > smoothed ? 0.22 : 0.09)

      const isImmersive = immersiveRef.current
      const compact = !isImmersive && width < COMPACT_WIDTH
      const cx = width / 2
      const cy = height / 2 + (isImmersive ? height * -0.03 : 0)
      const radiusScale = isImmersive ? 0.3 : 0.28
      const baseRadius =
        Math.min(width, height) *
        radiusScale *
        (1 + smoothed * (isImmersive ? 0.1 : 0.06))
      const dark = darkRef.current
      const palette = dark
        ? compact
          ? PALETTE_DARK_COMPACT
          : PALETTE_DARK
        : compact
          ? PALETTE_COMPACT
          : PALETTE

      const rimWeight = compact ? 0.48 : isImmersive ? 0.78 : 0.68
      const rimAlphaBase = compact ? 0.055 : isImmersive ? 0.1 : 0.075
      const dotBase = compact ? 0.4 : isImmersive ? 0.56 : 0.48
      const dotRimScale = compact ? 0.45 : isImmersive ? 0.9 : 0.72
      const shadeFloor = compact ? 0.55 : 0.5
      // Idle / compact: draw every other point. Playing immersive: full cloud.
      const pointStep = isActive && isImmersive ? 1 : 2
      const alphaGain = compact ? 0.74 : isImmersive ? 0.92 : 0.84
      const displaceGain = isImmersive ? 0.2 : 0.12
      const spinSpeed = isActive ? 0.14 + smoothed * 0.22 : 0.06

      context.clearRect(0, 0, width, height)

      {
        const field = context.createRadialGradient(
          cx,
          cy,
          baseRadius * 0.15,
          cx,
          cy,
          baseRadius * (isImmersive ? 2.35 : 1.85)
        )
        const a = (dark ? 0.16 : 0.12) + smoothed * (dark ? 0.32 : 0.24)
        field.addColorStop(0, `rgba(56, 189, 248, ${a})`)
        field.addColorStop(0.35, `rgba(37, 99, 235, ${a * 0.4})`)
        field.addColorStop(1, "rgba(37, 99, 235, 0)")
        context.fillStyle = field
        context.fillRect(0, 0, width, height)
      }

      {
        const body = context.createRadialGradient(
          cx - baseRadius * 0.2,
          cy - baseRadius * 0.26,
          baseRadius * 0.06,
          cx,
          cy,
          baseRadius * 1.02
        )
        if (dark) {
          body.addColorStop(0, `rgba(255, 255, 255, ${0.32 + smoothed * 0.18})`)
          body.addColorStop(
            0.2,
            `rgba(186, 230, 253, ${0.2 + smoothed * 0.14})`
          )
          body.addColorStop(
            0.5,
            `rgba(14, 165, 233, ${0.16 + smoothed * 0.12})`
          )
          body.addColorStop(0.8, `rgba(37, 99, 235, ${0.1 + smoothed * 0.06})`)
          body.addColorStop(1, "rgba(15, 23, 42, 0)")
        } else {
          body.addColorStop(0, `rgba(255, 255, 255, ${0.78 + smoothed * 0.1})`)
          body.addColorStop(
            0.15,
            `rgba(224, 242, 254, ${0.5 + smoothed * 0.12})`
          )
          body.addColorStop(
            0.4,
            `rgba(125, 211, 252, ${0.32 + smoothed * 0.16})`
          )
          body.addColorStop(0.7, `rgba(56, 189, 248, ${0.18 + smoothed * 0.1})`)
          body.addColorStop(1, "rgba(147, 197, 253, 0)")
        }
        context.fillStyle = body
        context.beginPath()
        context.arc(cx, cy, baseRadius * 1.02, 0, Math.PI * 2)
        context.fill()
      }

      {
        const pulse = 0.92 + smoothed * 0.14
        const rim = context.createRadialGradient(
          cx,
          cy,
          baseRadius * (0.82 * pulse),
          cx,
          cy,
          baseRadius * (1.12 * pulse)
        )
        const rimA = 0.18 + smoothed * 0.45
        rim.addColorStop(0, "rgba(255, 255, 255, 0)")
        rim.addColorStop(0.65, `rgba(186, 230, 253, ${rimA * 0.2})`)
        rim.addColorStop(0.88, `rgba(56, 189, 248, ${rimA})`)
        rim.addColorStop(1, "rgba(37, 99, 235, 0)")
        context.fillStyle = rim
        context.beginPath()
        context.arc(cx, cy, baseRadius * 1.15 * pulse, 0, Math.PI * 2)
        context.fill()
      }

      // Soft dots via alpha — avoid context.filter blur (main-thread killer).
      const spinY = t * spinSpeed
      const cosY = Math.cos(spinY)
      const sinY = Math.sin(spinY)
      const tilt = 0.3
      const cosX = Math.cos(tilt)
      const sinX = Math.sin(tilt)

      for (let i = 0; i < points.length; i += pointStep) {
        const p = points[i]
        const wave =
          swell(p, t) * (0.65 + smoothed * 0.35) + micro(p, t) * smoothed * 0.55
        const displaced = 1 + smoothed * displaceGain * wave
        const px = p.x * displaced
        const py = p.y * displaced
        const pz = p.z * displaced

        const rx = px * cosY + pz * sinY
        const rzY = pz * cosY - px * sinY
        const ry = py * cosX - rzY * sinX
        const rz = py * sinX + rzY * cosX

        const scale = FOV / (FOV + rz)
        const sx = cx + rx * baseRadius * scale
        const sy = cy + ry * baseRadius * scale
        const rim = 1 - Math.abs(rz)

        const inv = 1 / displaced
        const lambert = Math.max(
          0,
          rx * inv * LIGHT.x + ry * inv * LIGHT.y + rz * inv * LIGHT.z
        )
        const spec = Math.pow(lambert, 3.4)
        const shade = shadeFloor + (1 - shadeFloor) * (1 - lambert * 0.8)
        const alpha =
          ((rimAlphaBase + rimWeight * rim * rim) * shade +
            spec * (isImmersive ? 0.62 : 0.48)) *
          alphaGain *
          (0.82 + smoothed * 0.35)
        const dot =
          (dotBase + dotRimScale * scale * rim) *
          (1 + spec * 0.6) *
          (1 + smoothed * 0.28)

        context.globalAlpha = Math.min(1, alpha)
        context.fillStyle = palette[Math.round(spec * (PALETTE_STEPS - 1))]
        context.beginPath()
        context.arc(sx, sy, dot, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1

      {
        const hl = context.createRadialGradient(
          cx - baseRadius * 0.26,
          cy - baseRadius * 0.34,
          0,
          cx - baseRadius * 0.16,
          cy - baseRadius * 0.26,
          baseRadius * 0.5
        )
        hl.addColorStop(0, `rgba(255, 255, 255, ${dark ? 0.4 : 0.62})`)
        hl.addColorStop(0.4, `rgba(255, 255, 255, ${dark ? 0.1 : 0.16})`)
        hl.addColorStop(1, "rgba(255, 255, 255, 0)")
        context.fillStyle = hl
        context.beginPath()
        context.ellipse(
          cx - baseRadius * 0.18,
          cy - baseRadius * 0.3,
          baseRadius * 0.4,
          baseRadius * 0.26,
          -0.45,
          0,
          Math.PI * 2
        )
        context.fill()
      }
    }

    const draw = (now: number) => {
      if (!visible) {
        frame = 0
        return
      }

      const isStill = stillRef.current
      const isActive = activeRef.current && !isStill
      const minGap = isActive ? 0 : IDLE_FRAME_MS

      if (now - lastPaint >= minGap) {
        lastPaint = now
        paint(now)
      }

      if (isStill) {
        frame = 0
        return
      }

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [amplitudeRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("block size-full", className)}
    />
  )
}
