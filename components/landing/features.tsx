import type { ComponentProps, ReactNode } from "react"
import { getTranslations } from "next-intl/server"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  LANDING_CONTAINER_WIDE,
  LANDING_SECTION_HEADER_MB,
  LANDING_SECTION_PY,
  LANDING_SECTION_TITLE,
} from "@/lib/landing-layout"
import { cn } from "@/lib/utils"

const FEATURE_CARD_CLASS =
  "group relative isolate h-full overflow-hidden border-border/60 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-[border-color,background-color] duration-300 hover:border-border/85 hover:bg-card/90 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_2.5%,transparent)_1px,transparent_1px)] before:bg-size-[40px_40px] before:[mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_88%)] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"

function FeatureCard({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card data-reveal className={cn(FEATURE_CARD_CLASS, className)} {...props} />
}

function FeatureIllustrationSlot({
  children,
  className,
  inset = "default",
}: {
  children: ReactNode
  className?: string
  inset?: "default" | "compact" | "none"
}) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div
        className={cn(
          "relative h-full w-full",
          inset === "none"
            ? undefined
            : inset === "compact"
              ? "px-1.5 py-2 sm:px-2"
              : "px-2 pt-4 pb-2 sm:px-3 sm:pt-5 sm:pb-3"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function FeatureCardTop({
  title,
  body,
  illustration,
  className,
}: {
  title: string
  body: string
  illustration: ReactNode
  className?: string
}) {
  return (
    <FeatureCard className={className}>
      <CardContent className="relative z-10 flex h-full flex-col px-4 pt-8 pb-5 sm:px-5 sm:pt-9 sm:pb-6">
        <FeatureIllustrationSlot inset="none" className="mt-2 aspect-386/130 w-full shrink-0 sm:mt-3">
          {illustration}
        </FeatureIllustrationSlot>
        <div className="mt-auto space-y-1.5 pt-5 text-center sm:pt-6">
          <CardTitle className="text-base font-medium tracking-tight sm:text-lg">
            {title}
          </CardTitle>
          <CardDescription className="text-pretty leading-relaxed">
            {body}
          </CardDescription>
        </div>
      </CardContent>
    </FeatureCard>
  )
}

function FeatureCardWide({
  title,
  body,
  illustration,
  className,
}: {
  title: string
  body: string
  illustration: ReactNode
  className?: string
}) {
  return (
    <FeatureCard className={className}>
      <CardContent className="relative z-10 grid h-full min-h-70 grid-cols-1 gap-6 p-5 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:items-stretch sm:gap-8 sm:p-6">
        <div className="flex flex-col justify-center space-y-2.5">
          <CardTitle className="text-base font-medium tracking-tight sm:text-lg">
            {title}
          </CardTitle>
          <CardDescription className="max-w-sm text-pretty leading-relaxed">
            {body}
          </CardDescription>
        </div>
        <FeatureIllustrationSlot inset="compact" className="aspect-320/220 w-full min-w-0">
          {illustration}
        </FeatureIllustrationSlot>
      </CardContent>
    </FeatureCard>
  )
}

const VIZ_WIDE = "0 -6 386 130"
const VIZ_TALL = "0 0 320 220"

function FeatureVizSvg({
  children,
  defs,
  viewBox = VIZ_WIDE,
}: {
  children: ReactNode
  defs?: ReactNode
  viewBox?: string
}) {
  return (
    <svg
      className="h-full w-full"
      viewBox={viewBox}
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
      {defs ? <defs>{defs}</defs> : null}
    </svg>
  )
}

function VizGlowFilter({ id, blur = 2.5 }: { id: string; blur?: number }) {
  return (
    <filter id={id} x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={blur} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}

function GlassRect({
  x,
  y,
  w,
  h,
  rx = 10,
  fill = 0.07,
  stroke = 0.2,
}: {
  x: number
  y: number
  w: number
  h: number
  rx?: number
  fill?: number
  stroke?: number
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} className="fill-foreground" fillOpacity={fill} />
      <rect x={x} y={y} width={w} height={h} rx={rx} className="stroke-foreground" strokeWidth="1" fill="none" strokeOpacity={stroke} />
      <line x1={x + 10} x2={x + w - 10} y1={y + 0.5} y2={y + 0.5} className="stroke-foreground" strokeWidth="1" opacity={stroke + 0.08} />
    </g>
  )
}

function GlassCircle({
  cx,
  cy,
  r,
  fill = 0.07,
  stroke = 0.22,
}: {
  cx: number
  cy: number
  r: number
  fill?: number
  stroke?: number
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-foreground" fillOpacity={fill} />
      <circle cx={cx} cy={cy} r={r} className="stroke-foreground" strokeWidth="1" fill="none" strokeOpacity={stroke} />
      <path
        d={`M ${cx - r * 0.58} ${cy - r * 0.8} A ${r} ${r} 0 0 1 ${cx + r * 0.58} ${cy - r * 0.8}`}
        className="stroke-foreground"
        strokeWidth="1"
        fill="none"
        opacity={Math.min(stroke + 0.12, 0.42)}
      />
    </g>
  )
}

function PulseLiveGraphic() {
  const px = 50
  const py = 48
  const wave =
    "M6 68C16 68 28 30 48 48C68 30 80 68 92 68C104 68 116 26 136 26C156 26 168 68 180 68C192 68 204 34 224 34C236 34 248 48 268 48C280 48 292 30 312 30C324 30 336 40 356 40C368 40 378 36 378 36"

  return (
    <FeatureVizSvg
      defs={
        <>
          <VizGlowFilter id="pulse-glow" blur={1.2} />
          <radialGradient id="pulse-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </>
      }
    >
        <ellipse cx={px} cy={py} rx="36" ry="28" fill="url(#pulse-radial)" className="text-foreground" />
        {[30, 21, 12].map((r, i) => (
          <circle key={r} cx={px} cy={py} r={r} className="stroke-foreground" strokeWidth="1" fill="none" opacity={0.2 - i * 0.06} vectorEffect="nonScalingStroke" />
        ))}
        <path
          d={wave}
          className="stroke-foreground"
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="nonScalingStroke"
        />
        <circle cx={px} cy={py} r="2.75" className="fill-foreground" filter="url(#pulse-glow)" />
        <circle cx={px} cy={py} r="1.25" className="fill-background" />
        <circle cx="376" cy="36" r="2.5" className="fill-foreground" opacity="0.9" />
        <rect x={px - 22} y="12" width="44" height="13" rx="6.5" className="fill-foreground" opacity="0.06" />
        <rect x={px - 22} y="12" width="44" height="13" rx="6.5" className="stroke-foreground" strokeWidth="1" fill="none" opacity="0.18" />
        <circle cx={px - 12} cy="18.5" r="2" className="fill-foreground" />
        <text x={px - 4} y="21.5" className="fill-foreground" fontSize="6" fontWeight="700" letterSpacing="0.16em" fontFamily="ui-sans-serif, system-ui, sans-serif">
          LIVE
        </text>
      </FeatureVizSvg>
  )
}

const ISO_CANDLES = [
  { x: 38, b: 54, t: 40, up: true },
  { x: 52, b: 52, t: 38, up: true },
  { x: 66, b: 54, t: 42, up: false },
  { x: 80, b: 50, t: 36, up: true },
  { x: 94, b: 48, t: 34, up: true },
  { x: 108, b: 50, t: 40, up: false },
  { x: 122, b: 46, t: 30, up: true },
  { x: 136, b: 44, t: 28, up: true },
  { x: 150, b: 42, t: 26, up: true },
  { x: 164, b: 40, t: 24, up: true },
  { x: 178, b: 38, t: 22, up: true },
] as const

function SignalChartGraphic() {
  return (
    <FeatureVizSvg
      defs={
        <>
          <VizGlowFilter id="signal-glow" blur={1.8} />
          <linearGradient id="candle-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </linearGradient>
        </>
      }
    >
        <g transform="translate(72 10)">
          <g transform="matrix(1 0 -0.48 1 0 0)">
            <GlassRect x={20} y={14} w={218} h={58} fill={0.025} stroke={0.08} />
            <GlassRect x={10} y={7} w={218} h={58} fill={0.04} stroke={0.12} />
            <GlassRect x={0} y={0} w={218} h={58} fill={0.08} stroke={0.24} />
            {ISO_CANDLES.map((c) => (
              <g key={c.x}>
                <line x1={c.x} x2={c.x} y1={c.t - 3} y2={c.b + 3} className="stroke-foreground" strokeWidth="1" opacity={c.up ? 0.85 : 0.22} />
                <rect
                  x={c.x - 2.5}
                  y={c.t}
                  width="5"
                  height={c.b - c.t}
                  rx="0.5"
                  fill={c.up ? "url(#candle-up)" : "none"}
                  className={c.up ? "text-foreground" : "stroke-foreground fill-background"}
                  strokeWidth="1"
                  strokeOpacity={c.up ? 0.95 : 0.28}
                  filter={c.up && c.x > 130 ? "url(#signal-glow)" : undefined}
                />
              </g>
            ))}
            <rect x={168} y={6} width="36" height="11" rx="5.5" className="fill-foreground" opacity="0.07" />
            <rect x={168} y={6} width="36" height="11" rx="5.5" className="stroke-foreground" strokeWidth="1" fill="none" opacity="0.22" />
            <text x={175} y="14.5" className="fill-foreground" fontSize="5.5" fontWeight="700" letterSpacing="0.1em" fontFamily="ui-sans-serif, system-ui, sans-serif">
              IRIS
            </text>
          </g>
        </g>
      </FeatureVizSvg>
  )
}

const STANCE_FILL =
  "M0 90C0 90 14.3 55 35 48C55.7 41 66 39 66 39C66 39 80.7 39 92.2 39C103.7 39 100.9 18 109 18C117.2 18 117.2 52 124.8 52C132.4 52 142.3 35 153.8 39C165.4 42 186.8 52 193.8 52C200.7 52 206.3 18 214.1 18C221.8 18 238.7 55 244.2 52C249.8 50 258.8 15 266.2 15C272.1 15 284.1 48 286.7 48C294.8 48 300.2 30 305.4 30C312.3 30 323.4 21 335.6 18C347.7 15 348.2 41 363.6 39C367.9 38.5 372.9 41 376.4 47C379.4 52 381 60 382.5 68C383.5 74 382.5 90 382.5 90H0Z"

const STANCE_STROKE =
  "M0 88C0 88 15.3 54 36 47C56.7 40 66.7 39 66.7 39C66.7 39 80 39 91.5 39C102.9 39 100.4 19 108.6 19C116.7 19 117.7 53 125.2 53C132.8 53 142.1 36 153.6 39C165.1 42 186.1 53 193 53C199.9 53 205.3 19 213 19C220.8 19 237.8 55 243.4 53C248.9 51 257.9 15.5 265.3 15.5C271.1 15.5 283.2 47 285.8 47C293.8 47.1 299.2 30 304.4 30C311.3 30 321.4 22 333.6 19C345.7 16 346.9 41 362.3 39C377.6 37 383 70 383 70"

function SpeedChartGraphic() {
  const peakX = 334
  const peakY = 19

  return (
    <FeatureVizSvg
      defs={
        <>
          <linearGradient id="stance-fill" x1="0" y1="10" x2="0" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="stance-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <VizGlowFilter id="stance-glow" blur={1.1} />
        </>
      }
    >
        <path fillRule="evenodd" clipRule="evenodd" d={STANCE_FILL} fill="url(#stance-fill)" />
        <path
          d="M24 90C40 72 60 64 80 58C100 52 120 48 140 44C160 40 180 38 200 36C220 34 240 32 260 30C280 28 300 26 320 24C340 22 360 20 372 18"
          className="fill-foreground"
          opacity="0.04"
        />
        <path
          className="text-foreground"
          d={STANCE_STROKE}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          vectorEffect="nonScalingStroke"
        />
        <ellipse cx={peakX} cy={peakY + 8} rx="22" ry="18" fill="url(#stance-radial)" className="text-foreground" />
        {[11, 7, 3.5].map((r, i) => (
          <circle key={r} cx={peakX} cy={peakY} r={r} className="stroke-foreground" strokeWidth="1" fill="none" opacity={0.16 - i * 0.04} vectorEffect="nonScalingStroke" />
        ))}
        <circle cx={peakX} cy={peakY} r="2.5" className="fill-foreground" filter="url(#stance-glow)" />
        <circle cx={peakX} cy={peakY} r="1.25" className="fill-background" />
      </FeatureVizSvg>
  )
}

const NEWS_STACK = [
  { dx: 20, dy: 18, fill: 0.03, stroke: 0.09, time: "27m" },
  { dx: 10, dy: 9, fill: 0.05, stroke: 0.13, time: "12m" },
  { dx: 0, dy: 0, fill: 0.08, stroke: 0.22, time: "3m" },
] as const

function NewsBulletsGraphic() {
  return (
    <FeatureVizSvg viewBox={VIZ_TALL}>
      <g transform="translate(36 54)">
        <g transform="matrix(1 0 -0.28 1 0 0)">
          {NEWS_STACK.map((layer) => (
            <g key={layer.time}>
              <GlassRect x={layer.dx} y={layer.dy} w={248} h={68} rx={12} fill={layer.fill} stroke={layer.stroke} />
              <circle cx={layer.dx + 22} cy={layer.dy + 34} r="4.5" className="fill-foreground" opacity={layer.time === "3m" ? 0.55 : 0.18} />
              <rect x={layer.dx + 36} y={layer.dy + 26} width={layer.time === "3m" ? 168 : 128} height="6" rx="3" className="fill-foreground" opacity={layer.time === "3m" ? 0.72 : 0.14} />
              <rect x={layer.dx + 36} y={layer.dy + 36} width={layer.time === "3m" ? 120 : 92} height="5" rx="2.5" className="fill-foreground" opacity={layer.time === "3m" ? 0.22 : 0.08} />
              {layer.time === "3m" && (
                <rect x={layer.dx + 36} y={layer.dy + 44} width={88} height="4" rx="2" className="fill-foreground" opacity="0.12" />
              )}
              <text x={layer.dx + 236} y={layer.dy + 15} textAnchor="end" className="fill-muted-foreground" fontSize="8" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif" opacity={layer.time === "3m" ? 1 : 0.42}>
                {layer.time}
              </text>
            </g>
          ))}
        </g>
      </g>
    </FeatureVizSvg>
  )
}

const HUB_NODES = [
  { deg: -90, icon: "chart" as const },
  { deg: -30, icon: "doc" as const },
  { deg: 30, icon: "link" as const },
  { deg: 90, icon: "video" as const },
  { deg: 150, icon: "folder" as const },
  { deg: 210, icon: "branch" as const },
] as const

function HubIcon({ type }: { type: (typeof HUB_NODES)[number]["icon"] }) {
  const s = { className: "stroke-foreground", strokeWidth: 1, fill: "none" as const, opacity: 0.5 }
  switch (type) {
    case "chart":
      return (
        <>
          <rect x="-3.5" y="1" width="1.75" height="4.5" rx="0.4" className="fill-foreground" opacity="0.38" />
          <rect x="-0.875" y="-1.5" width="1.75" height="7" rx="0.4" className="fill-foreground" opacity="0.62" />
          <rect x="1.75" y="0.5" width="1.75" height="5.5" rx="0.4" className="fill-foreground" opacity="0.48" />
        </>
      )
    case "doc":
      return <path d="M-3.5 -4.5H1.5L4.5 -1.5V4.5H-3.5V-4.5Z" {...s} />
    case "link":
      return <path d="M-3.5 0H-1.5M1.5 0H3.5M-1.5 0C-1.5 -2 1.5 -2 1.5 0C1.5 2 -1.5 2 -1.5 0" {...s} />
    case "video":
      return (
        <>
          <rect x="-4.5" y="-3.5" width="6.5" height="7" rx="1.25" {...s} />
          <path d="M2 -0.75L4.5 0.75V2.25L2 3.75V-0.75Z" className="fill-foreground" opacity="0.42" />
        </>
      )
    case "folder":
      return <path d="M-4.5 0H-1L1 -1.75H4.5V4.5H-4.5V0Z" {...s} />
    case "branch":
      return (
        <>
          <circle cx="-2.5" cy="0" r="1.25" className="fill-foreground" opacity="0.42" />
          <circle cx="2.5" cy="-2.5" r="1.25" className="fill-foreground" opacity="0.42" />
          <circle cx="2.5" cy="2.5" r="1.25" className="fill-foreground" opacity="0.42" />
          <path d="M-1.25 0H1.25M1.25 0L2.5 -2.5M1.25 0L2.5 2.5" {...s} opacity={0.35} />
        </>
      )
  }
}

function CopilotThreadGraphic() {
  const hx = 160
  const hy = 110
  const orbitR = 78
  const coreR = 28
  const hubRingR = 48
  const nodeR = 16
  const flat = 0.72

  return (
    <FeatureVizSvg
      viewBox={VIZ_TALL}
      defs={
        <>
          <VizGlowFilter id="hub-glow" blur={2.8} />
          <VizGlowFilter id="hub-node-glow" blur={1.6} />
          <radialGradient id="hub-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </>
      }
    >
      <ellipse cx={hx} cy={hy} rx="88" ry="66" fill="url(#hub-radial)" className="text-foreground" />
      {HUB_NODES.map((node) => {
        const rad = (node.deg * Math.PI) / 180
        const nx = hx + Math.cos(rad) * orbitR
        const ny = hy + Math.sin(rad) * orbitR * flat
        const sx = hx + Math.cos(rad) * coreR
        const sy = hy + Math.sin(rad) * coreR * flat
        return (
          <line key={`l-${node.icon}`} x1={sx} y1={sy} x2={nx - Math.cos(rad) * nodeR} y2={ny - Math.sin(rad) * nodeR * flat} className="stroke-foreground" strokeWidth="1" opacity="0.16" />
        )
      })}
      <GlassCircle cx={hx} cy={hy} r={hubRingR} fill={0.04} stroke={0.14} />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2 - Math.PI / 2
        const major = i % 3 === 0
        return (
          <line
            key={i}
            x1={hx + Math.cos(a) * (coreR + 4)}
            y1={hy + Math.sin(a) * (coreR + 4) * flat}
            x2={hx + Math.cos(a) * (hubRingR - 2)}
            y2={hy + Math.sin(a) * (hubRingR - 2) * flat}
            className="stroke-foreground"
            strokeWidth="1"
            opacity={major ? 0.36 : 0.12}
          />
        )
      })}
      <GlassCircle cx={hx} cy={hy} r={coreR} fill={0.08} stroke={0.24} />
      <path
        d={`M${hx} ${hy - 13}L${hx + 4} ${hy - 2.5}L${hx + 13} ${hy}L${hx + 4} ${hy + 2.5}L${hx} ${hy + 13}L${hx - 4} ${hy + 2.5}L${hx - 13} ${hy}L${hx - 4} ${hy - 2.5}Z`}
        className="fill-foreground"
        filter="url(#hub-glow)"
      />
      {HUB_NODES.map((node) => {
        const rad = (node.deg * Math.PI) / 180
        const nx = hx + Math.cos(rad) * orbitR
        const ny = hy + Math.sin(rad) * orbitR * flat
        return (
          <g key={node.icon}>
            <GlassCircle cx={nx} cy={ny} r={nodeR} fill={0.06} stroke={0.22} />
            <g transform={`translate(${nx} ${ny}) scale(1.45)`} filter="url(#hub-node-glow)">
              <HubIcon type={node.icon} />
            </g>
          </g>
        )
      })}
    </FeatureVizSvg>
  )
}

export async function LandingFeatures() {
  const t = await getTranslations("landing.features")

  return (
    <section
      id="features"
      aria-labelledby="landing-features-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <ScrollReveal className={LANDING_CONTAINER_WIDE}>
        <div
          data-reveal
          className={cn("mx-auto max-w-2xl text-center", LANDING_SECTION_HEADER_MB)}
        >
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("eyebrow")}
          </p>
          <h2
            id="landing-features-heading"
            className={LANDING_SECTION_TITLE}
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:mt-4 md:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative">
          <div className="relative z-10 grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <FeatureCardWide
              className="col-span-full"
              title={t("newsTitle")}
              body={t("newsBody")}
              illustration={<NewsBulletsGraphic />}
            />

            <FeatureCardWide
              className="col-span-full"
              title={t("copilotTitle")}
              body={t("copilotBody")}
              illustration={<CopilotThreadGraphic />}
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
