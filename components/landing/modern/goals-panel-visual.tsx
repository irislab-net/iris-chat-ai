"use client"

import { motion, useReducedMotion } from "motion/react"
import { UnlinkIcon } from "lucide-react"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import type { FeatureScrollStep, FeatureVisualRow } from "@/lib/landing-modern-data"
import {
  landingGlassBubbleAi,
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const EASE_OUT = [0.22, 1, 0.36, 1] as const
/** Matches the Exur step panel — keep all goal visuals at the same height. */
const GOALS_PANEL_SHELL_MIN_H = "min-h-[15.75rem]"

type PanelMotionContextValue = {
  cycle: number
  enabled: boolean
}

const PanelMotionContext = createContext<PanelMotionContextValue>({
  cycle: 0,
  enabled: false,
})

function usePanelMotion() {
  return useContext(PanelMotionContext)
}

function useActivationCycle(isActive: boolean) {
  const [cycle, setCycle] = useState(isActive ? 1 : 0)
  const wasActive = useRef(isActive)

  useEffect(() => {
    if (isActive && !wasActive.current) {
      setCycle((current) => current + 1)
    }
    wasActive.current = isActive
  }, [isActive])

  return cycle
}

function PanelMotionProvider({
  isActive,
  children,
}: {
  isActive: boolean
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const cycle = useActivationCycle(isActive)

  return (
    <PanelMotionContext.Provider value={{ cycle, enabled: isActive && !reduceMotion }}>
      {children}
    </PanelMotionContext.Provider>
  )
}

function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay, ease: EASE_OUT },
  }
}

function GlassSheen({ className }: { className?: string }) {
  return <div aria-hidden className={cn(landingGlassSheen, className)} />
}

function PanelLogoMark() {
  return (
    <span
      className={cn(
        landingGlassNavIcon,
        "relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-white/52 p-1.5"
      )}
      aria-hidden
    >
      <GlassSheen className="rounded-full" />
      <IrisLabLogo decorative size={28} variant="on-light" className="relative z-10 size-7" />
    </span>
  )
}

function ExurPanelShell({
  status,
  children,
  footer,
}: {
  status: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { enabled, cycle } = usePanelMotion()
  const motionProps = enabled ? reveal(0) : { initial: false, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div key={`shell-${cycle}`} className="w-full max-w-84 sm:max-w-88" {...motionProps}>
      <div
        className={cn(
          landingGlassSurface,
          GOALS_PANEL_SHELL_MIN_H,
          "flex flex-col overflow-hidden rounded-[1.75rem] bg-white/42 shadow-[0_20px_56px_rgba(15,23,42,0.09),inset_0_1px_1px_rgba(255,255,255,0.95)]"
        )}
      >
        <GlassSheen />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 right-0 size-32 rounded-full bg-white/50 blur-3xl"
        />

        <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <PanelLogoMark />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-[#64748B]">
              Exur
            </span>
          </div>
          <span
            className={cn(
              landingGlassSurface,
              "rounded-full bg-white/55 px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[#94A3B8] shadow-none"
            )}
          >
            {status}
          </span>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5">
          {children}
        </div>

        {footer && (
          <div className="relative z-10 shrink-0 px-5 pb-4">
            <div className="h-px bg-linear-to-r from-transparent via-white/70 to-transparent" />
            <div className="pt-3.5">{footer}</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FeaturedSignal({
  title,
  meta,
  index = 0,
}: {
  title: string
  meta?: string
  index?: number
}) {
  const { enabled, cycle } = usePanelMotion()
  const motionProps = enabled
    ? reveal(0.08 + index * 0.05)
    : { initial: false, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div
      key={`featured-${cycle}-${index}`}
      {...motionProps}
      className={cn(
        landingGlassSurface,
        "relative overflow-hidden rounded-2xl bg-white/62 px-4 py-4 shadow-[0_10px_32px_rgba(15,23,42,0.07)]"
      )}
    >
      <GlassSheen className="rounded-2xl" />
      <div className="relative z-10">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#94A3B8]">
          Worth watching
        </p>
        <p className="mt-2 text-[15px] font-medium leading-snug text-[#0F172A]">{title}</p>
        {meta && <p className="mt-1.5 font-mono text-[10px] text-[#94A3B8]">{meta}</p>}
      </div>
    </motion.div>
  )
}

function MutedFeedList({ rows }: { rows: readonly FeatureVisualRow[] }) {
  const { enabled, cycle } = usePanelMotion()

  return (
    <div className="space-y-3 pt-1">
      {rows.map((row, index) => (
        <motion.div
          key={`muted-${cycle}-${index}`}
          {...(enabled ? reveal(0.16 + index * 0.05) : { initial: false })}
          className="flex items-baseline justify-between gap-4 border-b border-white/45 pb-3 last:border-b-0 last:pb-0"
        >
          <span className="min-w-0 text-[13px] leading-snug text-[#94A3B8]">{row.title}</span>
          {row.meta && (
            <span className="shrink-0 font-mono text-[10px] text-[#CBD5E1]">{row.meta}</span>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function PanelRow({
  title,
  meta,
  state = "muted",
  index = 0,
}: FeatureVisualRow & { index?: number }) {
  const { enabled, cycle } = usePanelMotion()
  const isHighlight = state === "active" || state === "resolved"
  const motionProps = enabled
    ? reveal(0.1 + index * 0.05)
    : { initial: false, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div
      key={`row-${cycle}-${index}`}
      {...motionProps}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl px-4 py-3.5",
        isHighlight
          ? cn(landingGlassSurface, "bg-white/62 shadow-[0_8px_28px_rgba(15,23,42,0.07)]")
          : state === "conflict"
            ? "bg-white/35"
            : "bg-white/22"
      )}
    >
      {isHighlight && <GlassSheen className="rounded-2xl" />}
      <span
        className={cn(
          "relative z-10 size-1.5 shrink-0 rounded-full",
          isHighlight ? "bg-[#0F172A]" : "bg-[#CBD5E1]"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "relative z-10 min-w-0 flex-1 text-[13px] leading-snug",
          isHighlight ? "font-medium text-[#0F172A]" : "text-[#64748B]"
        )}
      >
        {title}
      </span>
      {meta && (
        <span className="relative z-10 shrink-0 font-mono text-[10px] text-[#94A3B8]">{meta}</span>
      )}
    </motion.div>
  )
}

function SplitBridge({ index }: { index: number }) {
  const { enabled, cycle } = usePanelMotion()
  const motionProps = enabled
    ? reveal(0.2 + index * 0.08)
    : { initial: false, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div
      key={`bridge-${cycle}-${index}`}
      {...motionProps}
      className="flex items-center justify-center py-1"
      aria-hidden
    >
      <UnlinkIcon className="size-3.5 text-[#CBD5E1]" strokeWidth={2} />
    </motion.div>
  )
}

function StressWeightBar({ index }: { index: number }) {
  const { enabled, cycle } = usePanelMotion()

  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/40" aria-hidden>
      {enabled ? (
        <motion.div
          key={`stress-${cycle}-${index}`}
          className="h-full rounded-full bg-[#94A3B8]/55"
          initial={{ width: "0%" }}
          animate={{ width: "33%" }}
          transition={{ duration: 0.5, delay: 0.18 + index * 0.07, ease: EASE_OUT }}
        />
      ) : (
        <div className="h-full w-1/3 rounded-full bg-[#94A3B8]/55" />
      )}
    </div>
  )
}

function PanelRowList({
  rows,
  split = false,
  stress = false,
}: {
  rows: readonly FeatureVisualRow[]
  split?: boolean
  stress?: boolean
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {rows.map((row, index) => (
        <div key={`${row.title}-${index}`}>
          <PanelRow {...row} index={index} />
          {stress && <StressWeightBar index={index} />}
          {split && index < rows.length - 1 && <SplitBridge index={index} />}
        </div>
      ))}
    </div>
  )
}

function PanelFooterNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-center font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-[#94A3B8]">
      {children}
    </p>
  )
}

function NoisePanel({ step }: { step: FeatureScrollStep }) {
  const rows = step.visualRows ?? []
  const [featured, ...muted] = rows

  return (
    <ExurPanelShell
      status={step.visualStatus ?? "Scanning"}
      footer={<PanelFooterNote>One signal worth your time</PanelFooterNote>}
    >
      <div className="flex h-full flex-col justify-center gap-4">
        {featured && <FeaturedSignal title={featured.title} meta={featured.meta} />}
        {muted.length > 0 && <MutedFeedList rows={muted} />}
        {step.visualOverflow && (
          <p className="px-1 font-mono text-[10px] text-[#CBD5E1]">{step.visualOverflow}</p>
        )}
      </div>
    </ExurPanelShell>
  )
}

function SplitPanel({ step }: { step: FeatureScrollStep }) {
  const rows = step.visualRows ?? []

  return (
    <ExurPanelShell
      status={step.visualStatus ?? "Disconnected"}
      footer={<PanelFooterNote>Accounts don&apos;t talk to each other</PanelFooterNote>}
    >
      <PanelRowList rows={rows} split />
    </ExurPanelShell>
  )
}

function StressPanel({ step }: { step: FeatureScrollStep }) {
  const rows = step.visualRows ?? []

  return (
    <ExurPanelShell
      status={step.visualStatus ?? "Undecided"}
      footer={<PanelFooterNote>Every option feels equally urgent</PanelFooterNote>}
    >
      <PanelRowList rows={rows} stress />
    </ExurPanelShell>
  )
}

function ExurPanel({ step }: { step: FeatureScrollStep }) {
  const rows = step.visualRows ?? []
  const answer = step.visualAnswer ?? "One clear answer. No dashboard required."
  const { enabled, cycle } = usePanelMotion()
  const verdictMotion = enabled
    ? reveal(0.22)
    : { initial: false, animate: { opacity: 1, y: 0 } }

  return (
    <ExurPanelShell status={step.visualStatus ?? "Clear"}>
      <div className="flex h-full flex-col justify-center gap-3">
        {rows.length > 0 && (
          <div className="space-y-2.5 opacity-45">
            {rows.map((row, index) => (
              <PanelRow key={`${row.title}-${index}`} {...row} index={index} />
            ))}
          </div>
        )}
        <motion.div
          key={`verdict-${cycle}`}
          {...verdictMotion}
          className={cn("relative overflow-hidden rounded-2xl", landingGlassBubbleAi)}
        >
          <GlassSheen className="rounded-2xl" />
          <div className="relative z-10 px-4 py-4 sm:px-5 sm:py-5">
            <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-[#94A3B8]">
              Verdict
            </p>
            <p className="text-sm leading-relaxed text-[#475569] sm:text-[0.9375rem]">{answer}</p>
          </div>
        </motion.div>
      </div>
    </ExurPanelShell>
  )
}

function GoalsPanelContent({ step }: { step: FeatureScrollStep }) {
  if (step.visual === "noise") return <NoisePanel step={step} />
  if (step.visual === "split") return <SplitPanel step={step} />
  if (step.visual === "stress") return <StressPanel step={step} />
  return <ExurPanel step={step} />
}

export function GoalsPanelVisual({
  step,
  isActive = true,
}: {
  step: FeatureScrollStep
  isActive?: boolean
}) {
  return (
    <PanelMotionProvider isActive={isActive}>
      <GoalsPanelContent step={step} />
    </PanelMotionProvider>
  )
}

export function GoalsPanelBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E2E8F0]/40 blur-3xl sm:size-72"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(248,250,252,0.95),transparent_58%)]"
      />
    </>
  )
}

export function GoalsAskBubble({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative w-fit max-w-md px-4 py-3 sm:px-5 sm:py-3.5",
        landingGlassSurface,
        "rounded-3xl rounded-br-md bg-white/48 shadow-[0_12px_40px_rgba(15,23,42,0.07)]"
      )}
    >
      <GlassSheen className="rounded-3xl rounded-br-md" />
      <p className="relative z-10 text-sm leading-relaxed text-[#0F172A] sm:text-[0.9375rem]">
        {children}
      </p>
    </div>
  )
}
