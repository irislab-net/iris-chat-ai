import { cn } from "@/lib/utils"
import { StakingCtaEllipsisLabel } from "@/components/pages/staking/StakingCtaEllipsisLabel"
import { getStakingCtaReasonDisplayLine } from "@/staking/cta"
import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"
import type { StakingCtaReasonTone } from "@/types/stakingCtaReason"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Info,
} from "lucide-react"

export type StakingCtaReasonProps = {
  reason: StakingCtaReasonModel | null
  /** For `aria-describedby` on the primary CTA when disabled */
  id?: string
  /** CSS-animated trailing "..." for neutral loading lines (fixed width). */
  animateEllipsis?: boolean
}

const TEXT_CLASS: Record<StakingCtaReasonTone, string> = {
  red: "text-red-600",
  amber: "text-amber-700",
  neutral: "text-muted-foreground",
}

const IC = "size-3.5 shrink-0"

function ReasonGlyph({
  tone,
  message,
}: {
  tone: StakingCtaReasonTone
  message: string
}) {
  const m = message.toLowerCase()

  if (tone === "red") {
    return (
      <AlertCircle className={cn(IC, "text-red-600")} aria-hidden strokeWidth={2} />
    )
  }
  if (tone === "amber") {
    return (
      <AlertTriangle className={cn(IC, "text-amber-600")} aria-hidden strokeWidth={2} />
    )
  }

  const loadingLike =
    m.includes("loading") ||
    m.includes("connecting") ||
    m.includes("syncing") ||
    m.includes("vault") ||
    m.includes("updating") ||
    m.includes("hang tight") ||
    m.includes("connecting wallet") ||
    m.includes("processing stake") ||
    m.includes("processing unstake") ||
    m.includes("processing approval")

  const waitingLike =
    m.includes("confirm in wallet") ||
    m.includes("approve in wallet") ||
    m.includes("confirm stake") ||
    m.includes("confirm withdraw") ||
    m.includes("switch in wallet") ||
    m.includes("almost done") ||
    m.includes("almost there") ||
    m.includes("on-chain soon") ||
    m.includes("waiting for wallet") ||
    m.includes("awaiting wallet") ||
    m.includes("still awaiting") ||
    m.includes("check your wallet") ||
    m.includes("check wallet") ||
    m.includes("still waiting") ||
    m.includes("finalizing stake")

  if (loadingLike) {
    return (
      <Skeleton
        className={cn(IC, "rounded-full")}
        aria-hidden
      />
    )
  }
  if (waitingLike) {
    return (
      <Clock className={cn(IC, "text-neutral-400")} aria-hidden strokeWidth={2} />
    )
  }
  return (
    <Info className={cn(IC, "text-neutral-400")} aria-hidden strokeWidth={2} />
  )
}

function statusLine(raw: StakingCtaReasonModel | null): {
  line: string
  empty: boolean
  tone: StakingCtaReasonTone
  title: string | undefined
} {
  if (raw == null) {
    return { line: "\u00A0", empty: true, tone: "neutral", title: undefined }
  }
  const line = getStakingCtaReasonDisplayLine(raw)
  if (line === "") {
    return { line: "\u00A0", empty: true, tone: "neutral", title: undefined }
  }
  const tone = raw.tone
  return { line, empty: false, tone, title: line }
}

/**
 * Single reserved line above the primary CTA: icon + truncated status (message and optional
 * hint folded into one line). Height is fixed so validation changes do not move the CTA.
 */
export function StakingCtaReason({
  reason,
  id,
  animateEllipsis = false,
}: StakingCtaReasonProps) {
  const { line, empty, tone, title } = statusLine(reason)

  return (
    <div
      id={id}
      className='flex min-h-5 w-full items-center gap-1 px-1'
      aria-live='polite'
    >
      <span
        className='flex size-3.5 shrink-0 items-center justify-center'
        aria-hidden
      >
        {!empty && reason ? (
          <ReasonGlyph tone={tone} message={reason.message} />
        ) : null}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left text-xs font-normal leading-tight",
          "motion-safe:transition-[color,opacity] motion-safe:duration-150 motion-safe:ease-out",
          TEXT_CLASS[empty ? "neutral" : tone],
          empty && "pointer-events-none select-none opacity-0"
        )}
        aria-hidden={empty}
        title={title}
      >
        {empty ? (
          line
        ) : (
          <StakingCtaEllipsisLabel
            text={line}
            animate={Boolean(animateEllipsis)}
            className="block truncate"
          />
        )}
      </span>
    </div>
  )
}
