import { STAKING_ACTIVITY_PANEL_ID } from "@/components/pages/staking/StakingActiveTxAmbient"
import { useStakingAmbientTxPresentation } from "@/components/pages/staking/stakingAmbientTxPresentationContext"
import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import { StakingTokenIcon } from "@/components/pages/staking/StakingTokenIcon"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { Badge } from "@/components/ui/staking-badge"
import {
  DATA_TABLE_BODY_ROW_REM_COMPACT_SM,
  DATA_TABLE_HEADER_REM_COMPACT_SM,
  type DataTableColumnMeta,
  DataTable,
} from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { publicTokenSymbolLabel } from "@/lib/publicTokenDisplay"
import {
  STAKING_STABLECOIN_LABEL,
  stakingTransactionExplorerUrl,
} from "@/constants/stakingVaultConfig"
import {
  fetchAffiliateTxHistory,
  type AffiliateHistoryRow,
} from "@/lib/stakingAffiliateTxHistory"
import {
  shouldDisplayStakingHistoryAmount,
  stakingHistoryRowTransactionExplorerUrl,
  type StakingHistoryRow,
  type StakingTxType,
} from "@/staking/execution"
import {
  buildOptimisticStakingHistoryRows,
  mergeOptimisticStakingHistoryRows,
} from "@/staking/tx/stakingOptimisticHistoryRows"
import { isStakingReferralEnabled } from "@/staking/config"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import type { ChainFamily } from "@/staking/core/types"
import {
  stakingPassiveMinIntervalElapsed,
  STAKING_PASSIVE_AFFILIATE_MIN_INTERVAL_MS,
} from "@/staking/notifications"
import {
  createStakingToastDedupeKey,
  stakingToastDedupeFingerprint,
  stakingToastError,
} from "@/staking/ui"
import { summarizeAffiliateHistoryError } from "@/lib/stakingUserFacingErrors"
import { shouldDeferInputAutofocusToUser } from "@/lib/inputAutofocusPolicy"
import {
  STAKING_SEARCH_SHELL,
  STAKING_SEARCH_SHELL_COLLAPSED,
  STAKING_SEARCH_SHELL_EXPANDED,
  STAKING_SEARCH_SHELL_QUERY_HINT,
  STAKING_TOOLBAR_ICON_BUTTON,
} from "@/staking/ui"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Coins,
  ExternalLink,
  HelpCircle,
  PackageOpen,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import {
  STAKING_GLASS_INNER,
  STAKING_SEGMENT_LIQUID_ACTIVE,
  STAKING_SEGMENT_LIQUID_BASE,
  STAKING_SEGMENT_LIQUID_IDLE,
  STAKING_SEGMENT_LIQUID_TRACK,
} from "./stakingGlassPanel"

function formatHash(hash: string) {
  if (hash.length < 14) return hash
  return `${hash.slice(0, 6)}…${hash.slice(-3)}`
}

function formatAddress(address: string) {
  if (!address) return "—"
  if (address.length < 14) return address
  return `${address.slice(0, 6)}…${address.slice(-3)}`
}

/** Numeric date and short time in the user’s locale, joined by "-" with no spaces around it. */
function formatTxDateTime(timestampSec: number) {
  if (!timestampSec) return "—"
  const d = new Date(timestampSec * 1000)
  const datePart = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
  return `${datePart}-${timePart}`
}

function CopyInlineValue({
  value,
  children,
  label,
  className,
}: {
  value: string
  children: ReactNode
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copiedTimerRef.current != null) {
        clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = null
      }
    },
    []
  )

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    if (copiedTimerRef.current != null) {
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = null
    }
    setCopied(true)
    copiedTimerRef.current = setTimeout(() => {
      copiedTimerRef.current = null
      setCopied(false)
    }, 1200)
  }

  return (
    <button
      type="button"
      title={copied ? "Copied" : `Copy ${label}`}
      className={cn(
        "group/copy-inline relative inline-flex max-w-full min-w-0 overflow-hidden whitespace-nowrap rounded px-0.5 py-0 text-left transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none",
        className
      )}
      onClick={handleCopy}
    >
      <span className="min-w-0 truncate transition-opacity group-hover/copy-inline:opacity-20 group-focus-visible/copy-inline:opacity-20">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 flex translate-y-1 items-center justify-center bg-white/90 text-[12px] font-medium text-neutral-700 opacity-0 transition-[opacity,transform] duration-200 group-hover/copy-inline:translate-y-0 group-hover/copy-inline:opacity-100 group-focus-visible/copy-inline:translate-y-0 group-focus-visible/copy-inline:opacity-100 sm:text-[13px]">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  )
}

const TX_TYPE_ICON: Record<
  StakingTxType,
  { Icon: LucideIcon; iconClassName: string }
> = {
  deposit: {
    Icon: ArrowDownToLine,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  withdraw: {
    Icon: ArrowUpFromLine,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  referral_reward: {
    Icon: Sparkles,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  approve: {
    Icon: ShieldCheck,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  transfer: {
    Icon: Send,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  transfer_from: {
    Icon: ArrowLeftRight,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  mint: {
    Icon: Coins,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  yield_deposit: {
    Icon: RefreshCw,
    iconClassName: "motion-reduce:animate-none animate-spin-slow",
  },
  admin: {
    Icon: Settings2,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
  other: {
    Icon: HelpCircle,
    iconClassName: "motion-reduce:animate-none animate-pulse",
  },
}

function TxTypeBadge({ type, label }: { type: StakingTxType; label: string }) {
  const { Icon, iconClassName } = TX_TYPE_ICON[type]
  return (
    <Badge
      size="sm"
      title={label}
      className="max-w-full min-w-0 gap-0.5 overflow-hidden px-1 py-0 text-left text-[12px] leading-snug font-normal whitespace-nowrap sm:text-[13px] sm:leading-snug"
    >
      <Icon className={cn("size-2.5 shrink-0", iconClassName)} aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </Badge>
  )
}

function AffiliateTypeBadge({ label }: { label: string }) {
  return (
    <Badge
      size="sm"
      title={label}
      className="max-w-full min-w-0 gap-0.5 overflow-hidden px-1 py-0 text-left text-[12px] leading-snug font-normal whitespace-nowrap sm:text-[13px] sm:leading-snug"
    >
      <Sparkles
        className="size-2.5 shrink-0 motion-reduce:animate-none animate-pulse"
        aria-hidden
      />
      <span className="min-w-0 truncate">{label}</span>
    </Badge>
  )
}

function TxStatusBadge({
  status,
}: {
  status: "success" | "failed" | "pending"
}) {
  if (status === "success") {
    return (
      <Badge
        size="sm"
        title="Success"
        className="rounded-full bg-neutral-100 px-1.5 py-px font-mono! text-[12px]! font-normal! leading-snug text-neutral-950"
      >
        <span>Success</span>
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge
        size="sm"
        title="Failed"
        className="rounded-full bg-neutral-100 px-1.5 py-px font-mono! text-[12px]! font-normal! leading-snug text-neutral-200"
      >
        <span>Failed</span>
      </Badge>
    )
  }
  return (
    <Badge
      size="sm"
      title="Pending"
      className="rounded-full bg-neutral-100 px-1.5 py-px font-mono! text-[12px]! font-normal! leading-snug text-amber-700"
    >
      <span>Pending</span>
    </Badge>
  )
}

/** Visible slice step; viewport shows 3–10 rows before inner scroll, then load more on scroll. */
const HISTORY_VIEWPORT_MIN_ROWS = 3
const HISTORY_VIEWPORT_MAX_ROWS = 10
const HISTORY_LOAD_BATCH = 10

const HISTORY_DESKTOP_VIEWPORT_MQ = "(min-width: 1024px)"

type HistoryViewportRowBudget = { min: number; max: number }

/** Desktop: cap table body to rows that fit the flex host (fixed viewport, inner scroll). */
function useHistoryViewportRowBudget(
  hostRef: RefObject<HTMLElement | null>
): HistoryViewportRowBudget | null {
  const [rowBudget, setRowBudget] = useState<HistoryViewportRowBudget | null>(
    null
  )

  useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return

    const mq = window.matchMedia(HISTORY_DESKTOP_VIEWPORT_MQ)

    const measure = () => {
      if (!mq.matches) {
        setRowBudget(null)
        return
      }
      const height = el.getBoundingClientRect().height
      if (height < 1) return

      const rootPx =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const headerPx = DATA_TABLE_HEADER_REM_COMPACT_SM * rootPx
      const rowPx = DATA_TABLE_BODY_ROW_REM_COMPACT_SM * rootPx
      const fitted = Math.max(
        HISTORY_VIEWPORT_MIN_ROWS,
        Math.floor(Math.max(0, height - headerPx) / rowPx)
      )
      setRowBudget({ min: fitted, max: fitted })
    }

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null
    ro?.observe(el)
    mq.addEventListener("change", measure)
    measure()

    return () => {
      ro?.disconnect()
      mq.removeEventListener("change", measure)
    }
  }, [hostRef])

  return rowBudget
}

/** Stable empty table data (avoid new `[]` each render → TanStack table churn). */
const DATA_TABLE_EMPTY_TX: StakingHistoryRow[] = []
const DATA_TABLE_EMPTY_AFF: AffiliateHistoryRow[] = []

function stakingHistoryRowId(row: StakingHistoryRow): string {
  return row.hash
}

function affiliateHistoryRowId(row: AffiliateHistoryRow): string {
  return row.hash
}

/**
 * Min height for mobile history stack (3 cards + `gap-3`) — matches loaded + loading stacks.
 */
const HISTORY_MOBILE_STACK_MIN_HEIGHT = "18.25rem"

/** Same outer shell as `TxHistoryCard` (mobile transaction rows). */
const TX_HISTORY_MOBILE_CARD_SHELL =
  "flex flex-col gap-1.5 px-3 py-3 text-[13px] border-b border-gray-100"

/** Same outer shell as `AffiliateHistoryCard` (mobile affiliate rows). */
const AFF_HISTORY_MOBILE_CARD_SHELL =
    "flex flex-col gap-1.5 px-3 py-3 text-[12px] border-b border-gray-100"

function HistoryMobileCardPlaceholder({
  variant,
}: {
  variant: "transaction" | "affiliate"
}) {
  const shell =
    variant === "affiliate"
      ? AFF_HISTORY_MOBILE_CARD_SHELL
      : TX_HISTORY_MOBILE_CARD_SHELL
  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-full bg-neutral-200/80" />
        <Skeleton className="h-4 w-32 bg-neutral-200/80" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-28 bg-neutral-200/80" />
        <Skeleton className="h-4 w-20 bg-neutral-200/80" />
      </div>
    </div>
  )
}

function TxHistoryCard({
  row,
  tokenDecimals,
  chainFamily,
}: {
  row: StakingHistoryRow
  tokenDecimals: number | null
  chainFamily: ChainFamily
}) {
  const showAmount = shouldDisplayStakingHistoryAmount(
    row.amount,
    row.amountWei,
    tokenDecimals
  )
  return (
    <div className={TX_HISTORY_MOBILE_CARD_SHELL}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <TxTypeBadge type={row.type} label={row.typeLabel} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-[11px] tabular-nums text-neutral-500">
            {formatTxDateTime(row.timestamp)}
          </span>
          <TxStatusBadge status={row.status} />
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          {showAmount ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap font-mono text-[13px] text-foreground">
              <StakingTokenIcon
                symbol={row.symbol}
                sizeClassName="size-5 shrink-0"
                chainFamily={chainFamily}
              />
              <span className="min-w-0 truncate">{row.amount}</span>
              <span className="shrink-0 text-[10px] font-normal text-neutral-400">
                {publicTokenSymbolLabel(row.symbol)}
              </span>
            </span>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-neutral-600">
          <CopyInlineValue
            value={row.hash}
            label="transaction hash"
            className="font-mono text-[11px] font-medium text-neutral-700"
          >
            {formatHash(row.hash)}
          </CopyInlineValue>
          <a
            href={stakingHistoryRowTransactionExplorerUrl(row)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open transaction in explorer"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function StakingHistoryEmptyCardContent({
  message,
  variant,
}: {
  message: string
  variant: "transaction" | "affiliate"
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-0 px-4 py-8 text-center text-sm leading-relaxed text-neutral-500"
    >
      <PackageOpen strokeWidth={1} className="size-6 shrink-0 text-neutral-400" aria-hidden />
      <span className="text-neutral-500">{message}</span>
    </div>
  )
}

function AffiliateHistoryCard({
  row,
  tokenDecimals,
  chainFamily,
}: {
  row: AffiliateHistoryRow
  tokenDecimals: number | null
  chainFamily: ChainFamily
}) {
  const showAmount = shouldDisplayStakingHistoryAmount(
    row.amount === "—" ? null : row.amount,
    null,
    tokenDecimals
  )
  return (
    <div className={AFF_HISTORY_MOBILE_CARD_SHELL}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <AffiliateTypeBadge label={row.typeLabel} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-[11px] tabular-nums text-neutral-500">
            {row.timestamp > 0 ? formatTxDateTime(row.timestamp) : "—"}
          </span>
          <TxStatusBadge status={row.status} />
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          {showAmount ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap font-mono text-[13px] text-foreground">
              <StakingTokenIcon
                symbol={row.symbol}
                sizeClassName="size-5 shrink-0"
                chainFamily={chainFamily}
              />
              <span className="min-w-0 truncate">{row.amount}</span>
              <span className="shrink-0 text-[10px] font-normal text-neutral-400">
                {publicTokenSymbolLabel(row.symbol)}
              </span>
            </span>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-neutral-600">
          <CopyInlineValue
            value={row.hash}
            label="transaction hash"
            className="font-mono text-[11px] font-medium text-neutral-700"
          >
            {formatHash(row.hash)}
          </CopyInlineValue>
          <a
            href={stakingTransactionExplorerUrl(row.hash)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open transaction in explorer"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function HistoryMobileList<TRow>({
  items,
  getKey,
  renderItem,
  onNearScrollEnd,
  canLoadMore,
  emptyMessage,
  isInitialLoading = false,
  skeletonRowCount = HISTORY_VIEWPORT_MIN_ROWS,
  mobileCardVariant,
}: {
  items: TRow[]
  getKey: (item: TRow) => string
  renderItem: (item: TRow) => ReactNode
  onNearScrollEnd?: () => void
  canLoadMore?: boolean
  emptyMessage: string
  isInitialLoading?: boolean
  skeletonRowCount?: number
  mobileCardVariant: "transaction" | "affiliate"
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const onNearScrollEndRef = useRef(onNearScrollEnd)
  onNearScrollEndRef.current = onNearScrollEnd

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !onNearScrollEnd || !canLoadMore) return
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) onNearScrollEndRef.current?.()
        }
      },
      { rootMargin: "200px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [canLoadMore, items.length, onNearScrollEnd])

  const stackShellClass = "flex min-w-0 flex-col gap-3"

  if (isInitialLoading) {
    return (
      <div
        className={stackShellClass}
        style={{ minHeight: HISTORY_MOBILE_STACK_MIN_HEIGHT }}
        aria-busy
      >
        {Array.from({ length: skeletonRowCount }).map((_, i) => (
          <HistoryMobileCardPlaceholder key={i} variant={mobileCardVariant} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(stackShellClass, "justify-center")}
        style={{ minHeight: HISTORY_MOBILE_STACK_MIN_HEIGHT }}
      >
        <StakingHistoryEmptyCardContent
          message={emptyMessage}
          variant={mobileCardVariant}
        />
      </div>
    )
  }

  return (
    <div
      className={stackShellClass}
      style={{ minHeight: HISTORY_MOBILE_STACK_MIN_HEIGHT }}
    >
      {items.map(item => (
        <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
      ))}
      {canLoadMore ? (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      ) : null}
    </div>
  )
}

function StakingAppTransactionHistory() {
  const referralsEnabled = isStakingReferralEnabled()
  const {
    executionAddress,
    runtimeWalletAddress,
    stakingExplorerUrl,
    stakingHistoryRows,
    stakingHistoryLoading,
    refreshStakingHistory,
    tokenSymbol,
    merchantTokenSymbol,
    tokenDecimals,
  } = useStakingVault()
  const { snapshot } = useTransactionStatus()
  const ambientPresentation = useStakingAmbientTxPresentation()
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const optimisticAnchorTimestampsRef = useRef<Map<string, number>>(new Map())
  const txHistoryIdentity = useMemo(
    () => runtimeWalletAddress?.trim() || null,
    [runtimeWalletAddress]
  )
  const affiliateWalletIdentity = executionAddress?.trim() || null
  const [historyTab, setHistoryTab] = useState<"transactions" | "affiliate">(
    "transactions"
  )
  useEffect(() => {
    if (!referralsEnabled && historyTab !== "transactions") {
      setHistoryTab("transactions")
    }
  }, [historyTab, referralsEnabled])
  const historyUiActive = useMemo(
    () =>
      !referralsEnabled || historyTab === "transactions"
        ? txHistoryIdentity
        : affiliateWalletIdentity,
    [historyTab, txHistoryIdentity, affiliateWalletIdentity, referralsEnabled]
  )
  const [searchValue, setSearchValue] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [affiliateRows, setAffiliateRows] = useState<AffiliateHistoryRow[]>([])
  const [affiliateLoading, setAffiliateLoading] = useState(false)
  const [affiliateError, setAffiliateError] = useState<string | null>(null)

  const lastAffiliateErrToastKey = useRef<string | null>(null)
  const lastAffiliatePassiveEmitAtRef = useRef<number | null>(null)
  useEffect(() => {
    const raw = (affiliateError ?? "").trim()
    if (!raw || affiliateRows.length > 0) {
      if (!raw) {
        lastAffiliateErrToastKey.current = null
        lastAffiliatePassiveEmitAtRef.current = null
      }
      return
    }
    if (lastAffiliateErrToastKey.current === raw) return
    const now = Date.now()
    if (
      !stakingPassiveMinIntervalElapsed(
        now,
        lastAffiliatePassiveEmitAtRef.current,
        STAKING_PASSIVE_AFFILIATE_MIN_INTERVAL_MS
      )
    ) {
      return
    }
    lastAffiliatePassiveEmitAtRef.current = now
    lastAffiliateErrToastKey.current = raw
    const { title, description } = summarizeAffiliateHistoryError()
    stakingToastError(title, {
      description,
      dedupeId: createStakingToastDedupeKey(
        "affiliate",
        "list_error",
        stakingToastDedupeFingerprint(raw),
      ),
    })
  }, [affiliateError, affiliateRows.length])

  const rows = stakingHistoryRows
  const activeDeploymentId = activeRuntimeSelection.deployment.id.trim()

  const rowsIsolated = useMemo(
    () =>
      rows.filter(
        r => (r.deploymentId?.trim() ?? "") === activeDeploymentId
      ),
    [rows, activeDeploymentId]
  )

  const holdTxRowsRef = useRef<StakingHistoryRow[]>([])
  const prevHoldDeploymentIdRef = useRef(activeDeploymentId)
  useEffect(() => {
    if (prevHoldDeploymentIdRef.current !== activeDeploymentId) {
      prevHoldDeploymentIdRef.current = activeDeploymentId
      holdTxRowsRef.current = []
    }
    if (!txHistoryIdentity) {
      holdTxRowsRef.current = []
      return
    }
    if (rowsIsolated.length > 0) holdTxRowsRef.current = rowsIsolated
  }, [activeDeploymentId, txHistoryIdentity, rowsIsolated])

  const vaultAddressForHistory =
    activeRuntimeSelection.deployment.vault.address.trim()

  const resolveOptimisticAnchorTimestampSec = useCallback(
    (hash: string) => {
      const key = hash.trim().toLowerCase()
      const existing = optimisticAnchorTimestampsRef.current.get(key)
      if (existing !== undefined) return existing
      const submittedAtMs = snapshot.submittedAt
      const anchored =
        submittedAtMs != null && Number.isFinite(submittedAtMs)
          ? Math.floor(submittedAtMs / 1000)
          : Math.floor(Date.now() / 1000)
      optimisticAnchorTimestampsRef.current.set(key, anchored)
      return anchored
    },
    [snapshot.submittedAt]
  )

  const optimisticHistoryRows = useMemo(() => {
    if (!txHistoryIdentity || !executionAddress?.trim()) return []
    return buildOptimisticStakingHistoryRows({
      displayTransactions: ambientPresentation.displayTransactions,
      mode: ambientPresentation.mode,
      deploymentId: activeDeploymentId,
      walletFrom: executionAddress.trim(),
      vaultTo: vaultAddressForHistory,
      tokenSymbol: tokenSymbol || STAKING_STABLECOIN_LABEL,
      submittedAtMs: snapshot.submittedAt,
      resolveAnchorTimestampSec: resolveOptimisticAnchorTimestampSec,
    })
  }, [
    txHistoryIdentity,
    executionAddress,
    ambientPresentation.displayTransactions,
    ambientPresentation.mode,
    activeDeploymentId,
    vaultAddressForHistory,
    tokenSymbol,
    snapshot.submittedAt,
    resolveOptimisticAnchorTimestampSec,
  ])

  useEffect(() => {
    const activeHashes = new Set(
      optimisticHistoryRows.map(r => r.hash.toLowerCase())
    )
    for (const key of [...optimisticAnchorTimestampsRef.current.keys()]) {
      if (!activeHashes.has(key)) {
        optimisticAnchorTimestampsRef.current.delete(key)
      }
    }
  }, [optimisticHistoryRows])

  const transactionRowsForUi = useMemo(() => {
    let base: StakingHistoryRow[]
    if (!txHistoryIdentity) {
      base = rowsIsolated
    } else if (rowsIsolated.length > 0) {
      base = rowsIsolated
    } else if (stakingHistoryLoading && holdTxRowsRef.current.length > 0) {
      base = holdTxRowsRef.current
    } else {
      base = rowsIsolated
    }
    const mergedRows = mergeOptimisticStakingHistoryRows(base, optimisticHistoryRows)
    return referralsEnabled
      ? mergedRows
      : mergedRows.filter(row => row.type !== "referral_reward")
  }, [
    txHistoryIdentity,
    rowsIsolated,
    stakingHistoryLoading,
    optimisticHistoryRows,
    referralsEnabled,
  ])

  const historyTableHostRef = useRef<HTMLDivElement | null>(null)
  const historyViewportRows = useHistoryViewportRowBudget(historyTableHostRef)
  const txHistoryScrollRef = useRef<HTMLDivElement | null>(null)
  const txHistoryScrollTopHoldRef = useRef<number | null>(null)
  const prevStakingHistoryLoadingRef = useRef(stakingHistoryLoading)

  useLayoutEffect(() => {
    const el = txHistoryScrollRef.current
    if (!el) return
    const was = prevStakingHistoryLoadingRef.current
    prevStakingHistoryLoadingRef.current = stakingHistoryLoading
    if (!was && stakingHistoryLoading && transactionRowsForUi.length > 0) {
      txHistoryScrollTopHoldRef.current = el.scrollTop
    }
    if (
      was &&
      !stakingHistoryLoading &&
      transactionRowsForUi.length > 0 &&
      txHistoryScrollTopHoldRef.current != null
    ) {
      el.scrollTop = txHistoryScrollTopHoldRef.current
      txHistoryScrollTopHoldRef.current = null
    }
  }, [stakingHistoryLoading, transactionRowsForUi.length])

  const fetchHistory = useCallback(async () => {
    if (!txHistoryIdentity) return
    try {
      await refreshStakingHistory({ shallow: true, skipIfInFlight: true })
    } catch {
      // Ignore fetch/parse failures; the hook owns retry and loading state.
    }
  }, [txHistoryIdentity, refreshStakingHistory])

  const fetchHistoryRef = useRef(fetchHistory)
  fetchHistoryRef.current = fetchHistory

  const lastHistoryResumeRefreshAtRef = useRef(0)

  useEffect(() => {
    if (!txHistoryIdentity) return

    const POLL_MS = 30_000
    const intervalId = window.setInterval(() => {
      void fetchHistoryRef.current()
    }, POLL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [txHistoryIdentity])

  useEffect(() => {
    if (!txHistoryIdentity) return
    const RESUME_DEBOUNCE_MS = 8000
    const onVis = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastHistoryResumeRefreshAtRef.current < RESUME_DEBOUNCE_MS) return
      lastHistoryResumeRefreshAtRef.current = now
      void refreshStakingHistory({ shallow: true, skipIfInFlight: true })
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [txHistoryIdentity, refreshStakingHistory])

  useEffect(() => {
    if (!txHistoryIdentity) return
    const RESUME_DEBOUNCE_MS = 8000
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      const now = Date.now()
      if (now - lastHistoryResumeRefreshAtRef.current < RESUME_DEBOUNCE_MS) return
      lastHistoryResumeRefreshAtRef.current = now
      void refreshStakingHistory({ shallow: true, skipIfInFlight: true })
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [txHistoryIdentity, refreshStakingHistory])

  const searchShellRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasSearchQuery = searchValue.trim().length > 0

  const [isBelowSm, setIsBelowSm] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 639px)")
    const sync = () => setIsBelowSm(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  /** On mobile the search bar stays expanded; desktop uses `searchExpanded`. */
  const searchUiExpanded = isBelowSm || searchExpanded

  useEffect(() => {
    if (isBelowSm) setSearchExpanded(true)
  }, [isBelowSm, historyTab])

  useEffect(() => {
    if (!searchUiExpanded) return
    if (shouldDeferInputAutofocusToUser()) return
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(id)
  }, [searchUiExpanded])

  useEffect(() => {
    if (!searchUiExpanded || isBelowSm) return
    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      const el = searchShellRef.current
      if (el && !el.contains(e.target as Node)) {
        setSearchExpanded(false)
      }
    }
    document.addEventListener("mousedown", onDocPointer)
    document.addEventListener("touchstart", onDocPointer)
    return () => {
      document.removeEventListener("mousedown", onDocPointer)
      document.removeEventListener("touchstart", onDocPointer)
    }
  }, [searchUiExpanded, isBelowSm])

  useEffect(() => {
    if (!searchUiExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      if (searchValue.trim()) {
        setSearchValue("")
      } else if (!isBelowSm) {
        setSearchExpanded(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [searchUiExpanded, searchValue, isBelowSm])

  const filteredTransactionRows = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    return transactionRowsForUi.filter(row => {
      const searchableText = [
        row.hash,
        formatHash(row.hash),
        row.type,
        row.typeLabel,
        row.amount,
        row.amountWei?.toString(),
        row.symbol,
        row.status,
        row.from,
        formatAddress(row.from),
        row.to,
        formatAddress(row.to),
        row.methodId,
        String(row.timestamp),
        new Date(row.timestamp * 1000).toLocaleString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return (
        keyword.length === 0 || searchableText.includes(keyword)
      )
    })
  }, [transactionRowsForUi, searchValue])

  const filteredAffiliateRows = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    return affiliateRows.filter(row => {
      const searchableText = [
        row.hash,
        formatHash(row.hash),
        row.typeLabel,
        row.amount,
        row.symbol,
        row.status,
        row.from,
        formatAddress(row.from),
        row.to,
        formatAddress(row.to),
        String(row.timestamp),
        new Date(row.timestamp * 1000).toLocaleString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return keyword.length === 0 || searchableText.includes(keyword)
    })
  }, [affiliateRows, searchValue])

  const orderedTransactionRows = useMemo(() => {
    return [...filteredTransactionRows].sort(
      (a, b) => b.timestamp - a.timestamp
    )
  }, [filteredTransactionRows])

  const orderedAffiliateRows = useMemo(() => {
    return [...filteredAffiliateRows].sort(
      (a, b) => b.timestamp - a.timestamp
    )
  }, [filteredAffiliateRows])

  const [txVisibleCount, setTxVisibleCount] = useState(HISTORY_LOAD_BATCH)
  const [affVisibleCount, setAffVisibleCount] = useState(HISTORY_LOAD_BATCH)

  useEffect(() => {
    setTxVisibleCount(HISTORY_LOAD_BATCH)
    setAffVisibleCount(HISTORY_LOAD_BATCH)
  }, [
    txHistoryIdentity,
    affiliateWalletIdentity,
    historyTab,
    searchValue,
    rowsIsolated.length,
    affiliateRows.length,
    activeRuntimeSelection.deployment.id,
  ])

  const txTableData = useMemo(
    () => orderedTransactionRows.slice(0, txVisibleCount),
    [orderedTransactionRows, txVisibleCount]
  )

  const affTableData = useMemo(
    () => orderedAffiliateRows.slice(0, affVisibleCount),
    [orderedAffiliateRows, affVisibleCount]
  )

  const txExpandAt = useRef(0)
  const onTxLoadMore = useCallback(() => {
    const now = Date.now()
    if (now - txExpandAt.current < 200) return
    txExpandAt.current = now
    setTxVisibleCount(c =>
      Math.min(c + HISTORY_LOAD_BATCH, orderedTransactionRows.length)
    )
  }, [orderedTransactionRows])

  const affExpandAt = useRef(0)
  const onAffLoadMore = useCallback(() => {
    const now = Date.now()
    if (now - affExpandAt.current < 200) return
    affExpandAt.current = now
    setAffVisibleCount(c =>
      Math.min(c + HISTORY_LOAD_BATCH, orderedAffiliateRows.length)
    )
  }, [orderedAffiliateRows])

  const txCanLoadMore = txVisibleCount < orderedTransactionRows.length
  const affCanLoadMore = affVisibleCount < orderedAffiliateRows.length

  const affiliateSymbol =
    merchantTokenSymbol || `M${tokenSymbol || STAKING_STABLECOIN_LABEL}`

  const evmHistoryPoolVault =
    activeRuntimeSelection.deployment.chainFamily === "evm"
      ? activeRuntimeSelection.deployment.vault.address.trim()
      : null

  const loadAffiliateHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!referralsEnabled || !affiliateWalletIdentity) {
        setAffiliateLoading(false)
        return
      }
      setAffiliateLoading(true)
      setAffiliateError(null)
      try {
        const data = await fetchAffiliateTxHistory(
          affiliateWalletIdentity,
          affiliateSymbol,
          signal,
          evmHistoryPoolVault
        )
        if (signal?.aborted) return
        setAffiliateRows(data.rows)
      } catch (e) {
        if (signal?.aborted) return
        if (e instanceof Error && e.name === "AbortError") return
        setAffiliateError(
          e instanceof Error ? e.message : "Could not load affiliate history"
        )
      } finally {
        if (!signal?.aborted) setAffiliateLoading(false)
      }
    },
    [affiliateWalletIdentity, affiliateSymbol, evmHistoryPoolVault, referralsEnabled]
  )

  const refreshBtnLoading =
    historyTab === "transactions" ? stakingHistoryLoading : affiliateLoading

  const handleManualRefresh = useCallback(async () => {
    if (historyTab === "transactions") {
      if (!txHistoryIdentity) {
        return
      }
    } else if (!affiliateWalletIdentity) {
      return
    }
    if (typeof refreshStakingHistory !== "function" && historyTab === "transactions") {
      return
    }
    try {
      if (historyTab === "transactions") {
        await refreshStakingHistory()
      } else {
        await loadAffiliateHistory()
      }
    } catch {
      /* hook / loadAffiliate own state */
    }
  }, [
    historyTab,
    txHistoryIdentity,
    affiliateWalletIdentity,
    refreshStakingHistory,
    loadAffiliateHistory,
  ])

  useEffect(() => {
    if (!referralsEnabled || !affiliateWalletIdentity) return
    const ac = new AbortController()
    void loadAffiliateHistory(ac.signal)
    return () => ac.abort()
  }, [affiliateWalletIdentity, loadAffiliateHistory, referralsEnabled])

  useEffect(() => {
    if (!referralsEnabled || !affiliateWalletIdentity || historyTab !== "affiliate") return
    const pollMs = 90_000
    const id = window.setInterval(() => {
      void loadAffiliateHistory()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [affiliateWalletIdentity, historyTab, loadAffiliateHistory, referralsEnabled])

  useEffect(() => {
    if (referralsEnabled) return
    setAffiliateRows([])
    setAffiliateLoading(false)
    setAffiliateError(null)
  }, [referralsEnabled])

  useEffect(() => {
    if (affiliateWalletIdentity) return
    setAffiliateRows([])
    setAffiliateError(null)
  }, [affiliateWalletIdentity])

  const tokenIconChainFamily = activeRuntimeSelection.deployment.chainFamily

  const columns = useMemo<ColumnDef<StakingHistoryRow>[]>(
    () => [
      {
        id: "type",
        accessorKey: "typeLabel",
        header: "Type",
        enableSorting: false,
        meta: {
          skeletonClassName: "h-5 w-[7rem] rounded-full",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <TxTypeBadge type={row.original.type} label={row.original.typeLabel} />
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: false,
        meta: {
          skeletonClassName: "h-5 w-28",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) =>
          shouldDisplayStakingHistoryAmount(
            row.original.amount,
            row.original.amountWei,
            tokenDecimals
          ) ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 whitespace-nowrap font-mono text-[13px] leading-snug text-neutral-700">
              <StakingTokenIcon
                symbol={row.original.symbol}
                sizeClassName="size-5 shrink-0"
                chainFamily={tokenIconChainFamily}
              />
              <span className="min-w-0 truncate">{row.original.amount}</span>
              <span className="shrink-0 text-[10px] font-normal text-neutral-400 sm:text-[11px]">
                {publicTokenSymbolLabel(row.original.symbol)}
              </span>
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        enableSorting: false,
        meta: {
          compactNoClip: true,
          skeletonClassName: "h-5 w-44",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-[13px] tabular-nums leading-snug text-neutral-500">
            {formatTxDateTime(row.original.timestamp)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="flex w-full justify-center">Status</span>
        ),
        enableSorting: false,
        meta: {
          skeletonClassName: "inline-flex h-5 w-20 rounded-full",
          skeletonCellJustify: "center",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <div className="flex w-full justify-center">
            <TxStatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        id: "tx",
        header: () => (
          <div className="w-full text-end text-[13px] font-medium leading-snug">Tx</div>
        ),
        enableSorting: false,
        meta: {
          skeletonClassName: "inline-block h-5 w-24",
          skeletonCellJustify: "end",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <div className="flex min-w-0 w-full items-center justify-end gap-1">
            <CopyInlineValue
              value={row.original.hash}
              label="transaction hash"
              className="flex min-w-0 justify-end font-mono text-[13px] font-medium leading-snug text-neutral-700"
            >
              {formatHash(row.original.hash)}
            </CopyInlineValue>
            <a
              href={stakingHistoryRowTransactionExplorerUrl(row.original)}
              target="_blank"
              rel="noreferrer"
              aria-label="Open transaction in explorer"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ),
      },
    ],
    [tokenDecimals, tokenIconChainFamily]
  )

  const affiliateColumns = useMemo<ColumnDef<AffiliateHistoryRow>[]>(
    () => [
      {
        id: "type",
        accessorKey: "typeLabel",
        header: "Type",
        enableSorting: false,
        meta: {
          skeletonClassName: "h-5 w-[7rem] rounded-full",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <AffiliateTypeBadge label={row.original.typeLabel} />
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: false,
        meta: {
          skeletonClassName: "h-5 w-28",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) =>
          shouldDisplayStakingHistoryAmount(
            row.original.amount === "—" ? null : row.original.amount,
            null,
            tokenDecimals
          ) ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 whitespace-nowrap font-mono text-[13px] leading-snug text-neutral-700">
              <StakingTokenIcon
                symbol={row.original.symbol}
                sizeClassName="size-5 shrink-0"
                chainFamily={tokenIconChainFamily}
              />
              <span className="min-w-0 truncate">{row.original.amount}</span>
              <span className="shrink-0 text-[10px] font-normal text-neutral-400 sm:text-[11px]">
                {publicTokenSymbolLabel(row.original.symbol)}
              </span>
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        enableSorting: false,
        meta: {
          compactNoClip: true,
          skeletonClassName: "h-5 w-44",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-[13px] tabular-nums leading-snug text-neutral-500">
            {row.original.timestamp > 0
              ? formatTxDateTime(row.original.timestamp)
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="flex w-full justify-center">Status</span>
        ),
        enableSorting: false,
        meta: {
          skeletonClassName: "inline-flex h-5 w-20 rounded-full",
          skeletonCellJustify: "center",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <div className="flex w-full justify-center">
            <TxStatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        id: "tx",
        header: () => (
          <div className="w-full text-end text-[13px] font-medium leading-snug">Tx</div>
        ),
        enableSorting: false,
        meta: {
          skeletonClassName: "inline-block h-5 w-24",
          skeletonCellJustify: "end",
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <div className="flex min-w-0 w-full items-center justify-end gap-1">
            <CopyInlineValue
              value={row.original.hash}
              label="transaction hash"
              className="flex min-w-0 justify-end font-mono text-[13px] font-medium leading-snug text-neutral-700"
            >
              {formatHash(row.original.hash)}
            </CopyInlineValue>
            <a
              href={stakingTransactionExplorerUrl(row.original.hash)}
              target="_blank"
              rel="noreferrer"
              aria-label="Open transaction in explorer"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:outline-none"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ),
      },
    ],
    [tokenDecimals, tokenIconChainFamily]
  )

  const isTxLoadingInitial =
    stakingHistoryLoading && transactionRowsForUi.length === 0
  const isAffiliateLoadingInitial =
    affiliateLoading && affiliateRows.length === 0

  const tableEmptyMessage = useMemo(() => {
    if (historyTab === "affiliate") {
      if (!affiliateWalletIdentity)
        return "Connect your wallet."
      return "No referral rewards yet"
    }
    if (!txHistoryIdentity)
      return "Connect your wallet."
    return "No deposits or withdrawals yet"
  }, [historyTab, affiliateWalletIdentity, txHistoryIdentity])

  const showTableSkeleton =
    historyTab === "transactions"
      ? Boolean(txHistoryIdentity && isTxLoadingInitial)
      : Boolean(affiliateWalletIdentity && isAffiliateLoadingInitial)
  const tableDataEmpty =
    (historyTab === "transactions" ? !txHistoryIdentity : !affiliateWalletIdentity) ||
    (historyTab === "transactions"
      ? filteredTransactionRows.length === 0
      : filteredAffiliateRows.length === 0)
  const compactTableCard = !showTableSkeleton && tableDataEmpty

  const renderTxCappedViewportEmpty = useCallback((message: string) => {
    return <StakingHistoryEmptyCardContent message={message} variant="transaction" />
  }, [])

  const renderAffCappedViewportEmpty = useCallback((message: string) => {
    return <StakingHistoryEmptyCardContent message={message} variant="affiliate" />
  }, [])

  const showActivityTabs = referralsEnabled

  const viewportMinBodyRows =
    historyViewportRows?.min ?? HISTORY_VIEWPORT_MIN_ROWS
  const viewportMaxBodyRows =
    historyViewportRows?.max ?? HISTORY_VIEWPORT_MAX_ROWS
  const viewportSkeletonRows = historyViewportRows?.max ?? HISTORY_VIEWPORT_MIN_ROWS

  return (
    <div
      id={STAKING_ACTIVITY_PANEL_ID}
      className="flex min-h-0 min-w-0 flex-1 flex-col scroll-mt-24 p-4 sm:p-6"
    >
      {showActivityTabs ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-2 sm:min-w-0 sm:flex-initial">
            <div className="min-w-0">
              <h3 className="font-brand text-lg font-semibold text-foreground">
                Activity
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!historyUiActive || refreshBtnLoading}
              onClick={() => void handleManualRefresh()}
              className={cn(
                STAKING_TOOLBAR_ICON_BUTTON, "sm:hidden"
              )}
              aria-label={
                historyTab === "transactions"
                  ? "Refresh staking activity"
                  : "Refresh referral rewards"
              }
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  refreshBtnLoading && "animate-spin motion-reduce:animate-none"
                )}
                aria-hidden
              />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:shrink-0 sm:justify-start">
            <h3 className="font-brand text-lg font-semibold text-foreground">
              Activity
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!historyUiActive || refreshBtnLoading}
              onClick={() => void handleManualRefresh()}
              className={cn(
                STAKING_TOOLBAR_ICON_BUTTON, "sm:hidden"
              )}
              aria-label="Refresh staking activity"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  refreshBtnLoading && "animate-spin motion-reduce:animate-none"
                )}
                aria-hidden
              />
            </Button>
          </div>
          <div className="flex min-w-0 w-full flex-1 items-center justify-end gap-2 sm:max-w-md sm:flex-none">
            <div
              ref={searchShellRef}
              role="search"
              aria-expanded={searchUiExpanded}
              aria-label="Search transactions"
              className={cn(
                STAKING_SEARCH_SHELL,
                "transition-[max-width,width,background-color,border-color,box-shadow] duration-520 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                searchUiExpanded
                  ? cn(
                      STAKING_SEARCH_SHELL_EXPANDED,
                      isBelowSm && "sm:max-w-full"
                    )
                  : STAKING_SEARCH_SHELL_COLLAPSED,
                hasSearchQuery &&
                  !searchUiExpanded &&
                  STAKING_SEARCH_SHELL_QUERY_HINT,
                !historyUiActive && "pointer-events-none opacity-60"
              )}
              onClick={() => {
                if (!historyUiActive || searchUiExpanded) return
                setSearchExpanded(true)
              }}
            >
              <span
                className={cn(
                  "pointer-events-none flex shrink-0 items-center justify-center text-muted-foreground",
                  searchUiExpanded ? "ps-3" : "size-full",
                  hasSearchQuery && !searchUiExpanded && "text-[#2563EB]"
                )}
                aria-hidden
              >
                <Search className="size-4 shrink-0" />
              </span>
              <Input
                id="staking-history-search-input"
                ref={searchInputRef}
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                placeholder="Search by hash, address, or type"
                disabled={!historyUiActive}
                tabIndex={searchUiExpanded ? undefined : -1}
                className={cn(
                  "h-full min-h-0 flex-1 rounded-none border-0 bg-transparent py-0 text-[15px] leading-none text-foreground shadow-none transition-opacity duration-520 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:bg-transparent disabled:opacity-60 dark:bg-transparent sm:text-sm",
                  searchUiExpanded
                    ? "pointer-events-auto ps-2 opacity-100"
                    : "pointer-events-none w-0 max-w-0 flex-none overflow-hidden p-0 opacity-0",
                  searchUiExpanded && hasSearchQuery ? "pe-2" : searchUiExpanded ? "pe-3" : "",
                  "placeholder:text-[13px] placeholder:leading-none placeholder:text-muted-foreground/75 sm:placeholder:text-sm"
                )}
              />
              {searchUiExpanded && hasSearchQuery ? (
                <button
                  type="button"
                  className="me-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground"
                  onClick={event => {
                    event.stopPropagation()
                    setSearchValue("")
                    if (!shouldDeferInputAutofocusToUser()) {
                      searchInputRef.current?.focus({ preventScroll: true })
                    }
                  }}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!historyUiActive || refreshBtnLoading}
              onClick={() => void handleManualRefresh()}
              className={cn(STAKING_TOOLBAR_ICON_BUTTON, "hidden sm:inline-flex")}
              aria-label="Refresh transaction history"
            >
              <RefreshCw
                className={cn(
                  "size-4 sm:size-3.5",
                  refreshBtnLoading && "animate-spin motion-reduce:animate-none"
                )}
                aria-hidden
              />
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
          showActivityTabs ? "mt-3" : "mt-2"
        )}
      >
        {showActivityTabs ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={cn(
                "flex min-w-0 shrink-0 gap-0.5 self-stretch sm:self-auto",
                STAKING_SEGMENT_LIQUID_TRACK
              )}
              role="tablist"
              aria-label="Activity category"
            >
              <button
                type="button"
                role="tab"
                aria-selected={historyTab === "transactions"}
                className={cn(
                  STAKING_SEGMENT_LIQUID_BASE,
                  historyTab === "transactions"
                    ? STAKING_SEGMENT_LIQUID_ACTIVE
                    : STAKING_SEGMENT_LIQUID_IDLE
                )}
                onClick={() => setHistoryTab("transactions")}
              >
                Staking
              </button>
              {referralsEnabled ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={historyTab === "affiliate"}
                  className={cn(
                    STAKING_SEGMENT_LIQUID_BASE,
                    historyTab === "affiliate"
                      ? STAKING_SEGMENT_LIQUID_ACTIVE
                      : STAKING_SEGMENT_LIQUID_IDLE
                  )}
                  onClick={() => setHistoryTab("affiliate")}
                >
                  Referrals
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-md sm:flex-none">
              <div
                ref={searchShellRef}
                role="search"
                aria-expanded={searchUiExpanded}
                aria-label={
                  historyTab === "affiliate"
                    ? "Search affiliate activity"
                    : "Search transactions"
                }
                className={cn(
                  STAKING_SEARCH_SHELL,
                  "transition-[max-width,width,background-color,border-color,box-shadow] duration-520 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                  searchUiExpanded
                    ? cn(
                        STAKING_SEARCH_SHELL_EXPANDED,
                        isBelowSm && "sm:max-w-full"
                      )
                    : STAKING_SEARCH_SHELL_COLLAPSED,
                  hasSearchQuery &&
                    !searchUiExpanded &&
                    STAKING_SEARCH_SHELL_QUERY_HINT,
                  !historyUiActive && "pointer-events-none opacity-60"
                )}
                onClick={() => {
                  if (!historyUiActive || searchUiExpanded) return
                  setSearchExpanded(true)
                }}
              >
                <span
                  className={cn(
                    "pointer-events-none flex shrink-0 items-center justify-center text-muted-foreground",
                    searchUiExpanded ? "ps-3" : "size-full",
                    hasSearchQuery && !searchUiExpanded && "text-[#2563EB]"
                  )}
                  aria-hidden
                >
                  <Search className="size-4 shrink-0" />
                </span>
                <Input
                  id="staking-history-search-input"
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={event => setSearchValue(event.target.value)}
                  placeholder={
                    historyTab === "affiliate"
                      ? "Search by hash, address, or label"
                      : "Search by hash, address, or type"
                  }
                  disabled={!historyUiActive}
                  tabIndex={searchUiExpanded ? undefined : -1}
                  className={cn(
                    "h-full min-h-0 flex-1 rounded-none border-0 bg-transparent py-0 text-[15px] leading-none text-foreground shadow-none transition-opacity duration-520 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:bg-transparent disabled:opacity-60 dark:bg-transparent sm:text-sm",
                    searchUiExpanded
                      ? "pointer-events-auto ps-2 opacity-100"
                      : "pointer-events-none w-0 max-w-0 flex-none overflow-hidden p-0 opacity-0",
                    searchUiExpanded && hasSearchQuery ? "pe-2" : searchUiExpanded ? "pe-3" : "",
                    "placeholder:text-[13px] placeholder:leading-none placeholder:text-muted-foreground/75 sm:placeholder:text-sm"
                  )}
                />
                {searchUiExpanded && hasSearchQuery ? (
                  <button
                    type="button"
                    className="me-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground"
                    onClick={event => {
                      event.stopPropagation()
                      setSearchValue("")
                      if (!shouldDeferInputAutofocusToUser()) {
                        searchInputRef.current?.focus({ preventScroll: true })
                      }
                    }}
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!historyUiActive || refreshBtnLoading}
                onClick={() => void handleManualRefresh()}
                className={cn(STAKING_TOOLBAR_ICON_BUTTON, "hidden sm:inline-flex")}
                aria-label={
                  historyTab === "transactions"
                    ? "Refresh transaction history"
                    : "Refresh affiliate history"
                }
              >
                <RefreshCw
                  className={cn(
                    "size-4 sm:size-3.5",
                    refreshBtnLoading && "animate-spin motion-reduce:animate-none"
                  )}
                  aria-hidden
                />
              </Button>
            </div>
          </div>
        ) : null}

        <div
          ref={historyTableHostRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
        <div
          className={cn(
            STAKING_GLASS_INNER,
            "relative flex min-h-0 flex-1 flex-col [scrollbar-gutter:stable]"
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {historyTab === "transactions" ? (
              <>
                <div className="hidden min-h-0 flex-1 sm:flex sm:flex-col">
                  <DataTable
                    key={`tx-${txHistoryIdentity ?? ""}`}
                    columns={columns}
                    data={txHistoryIdentity ? txTableData : DATA_TABLE_EMPTY_TX}
                    getRowId={stakingHistoryRowId}
                    embedded
                    compact
                    compactEmpty={compactTableCard}
                    emptyMessage={tableEmptyMessage}
                    hidePagination
                    viewportMinBodyRows={viewportMinBodyRows}
                    viewportMaxBodyRows={viewportMaxBodyRows}
                    bodyRowRem={DATA_TABLE_BODY_ROW_REM_COMPACT_SM}
                    showBodySkeleton={showTableSkeleton}
                    bodySkeletonRowCount={viewportSkeletonRows}
                    onNearScrollEnd={onTxLoadMore}
                    canLoadMore={Boolean(txHistoryIdentity) && txCanLoadMore}
                    className="min-h-0 flex-1"
                    renderCappedViewportEmpty={renderTxCappedViewportEmpty}
                    viewportScrollRef={txHistoryScrollRef}
                  />
                </div>
                <div className="sm:hidden">
                  <HistoryMobileList
                    items={txHistoryIdentity ? txTableData : DATA_TABLE_EMPTY_TX}
                    getKey={row => row.hash}
                    renderItem={row => (
                      <TxHistoryCard
                        row={row}
                        tokenDecimals={tokenDecimals}
                        chainFamily={tokenIconChainFamily}
                      />
                    )}
                    onNearScrollEnd={onTxLoadMore}
                    canLoadMore={Boolean(txHistoryIdentity) && txCanLoadMore}
                    emptyMessage={tableEmptyMessage}
                    isInitialLoading={showTableSkeleton}
                    mobileCardVariant="transaction"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="hidden min-h-0 flex-1 sm:flex sm:flex-col">
                  <DataTable
                    key={`aff-${affiliateWalletIdentity ?? ""}`}
                    columns={affiliateColumns}
                    data={affiliateWalletIdentity ? affTableData : DATA_TABLE_EMPTY_AFF}
                    getRowId={affiliateHistoryRowId}
                    embedded
                    compact
                    compactEmpty={compactTableCard}
                    emptyMessage={tableEmptyMessage}
                    hidePagination
                    viewportMinBodyRows={viewportMinBodyRows}
                    viewportMaxBodyRows={viewportMaxBodyRows}
                    bodyRowRem={DATA_TABLE_BODY_ROW_REM_COMPACT_SM}
                    showBodySkeleton={showTableSkeleton}
                    bodySkeletonRowCount={viewportSkeletonRows}
                    onNearScrollEnd={onAffLoadMore}
                    canLoadMore={Boolean(affiliateWalletIdentity) && affCanLoadMore}
                    className="min-h-0 flex-1"
                    renderCappedViewportEmpty={renderAffCappedViewportEmpty}
                  />
                </div>
                <div className="sm:hidden">
                  <HistoryMobileList
                    items={affiliateWalletIdentity ? affTableData : DATA_TABLE_EMPTY_AFF}
                    getKey={row => row.hash}
                    renderItem={row => (
                      <AffiliateHistoryCard
                        row={row}
                        tokenDecimals={tokenDecimals}
                        chainFamily={tokenIconChainFamily}
                      />
                    )}
                    onNearScrollEnd={onAffLoadMore}
                    canLoadMore={Boolean(affiliateWalletIdentity) && affCanLoadMore}
                    emptyMessage={tableEmptyMessage}
                    isInitialLoading={showTableSkeleton}
                    mobileCardVariant="affiliate"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        </div>

        <div className="flex min-h-6 shrink-0 justify-end">
          {stakingExplorerUrl ? (
            <a
              href={stakingExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-light text-neutral-700 underline"
            >
              Open full address activity
              <ExternalLink className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default StakingAppTransactionHistory
