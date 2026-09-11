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

const VIZ_TALL = "0 0 320 220"

function FeatureVizSvg({
  children,
  defs,
  viewBox = VIZ_TALL,
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
