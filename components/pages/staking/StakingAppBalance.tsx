import { RollingTokenAmount } from "@/components/pages/staking/RollingTokenAmount"
import { StakingApyBadge } from "@/components/pages/staking/StakingApyBadge"
import { STAKING_BALANCE_LIQUID_CARD } from "@/components/pages/staking/stakingGlassPanel"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  STAKING_PNL_USD_PER_TOKEN,
  STAKING_STABLECOIN_LABEL,
} from "@/constants/stakingVaultConfig"
import { useProfitManagerStatus } from "@/hooks/useProfitManagerStatus"
import { useRollingStakedDisplayFloat } from "@/hooks/useRollingStakedDisplay"
import { notifyStakingRefresh } from "@/staking/refresh"
import {
  getStakingPnlDirectionFromWei,
  isResidualDustStakingPosition,
  isSettledResidualPosition,
  normalizeSignedZeroDisplay,
  selectCostBasisTokenFloat,
  selectPnlTokenFloat,
  selectStakingRoiPercent,
  type StakingPnlDirection,
} from "@/staking/affiliate/stakingAffiliatePresentation"
import { publicTokenSymbolLabel } from "@/lib/publicTokenDisplay"
import { cn } from "@/lib/utils"
import { parseUnits } from "ethers"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/** Token-denominated neutral band for PnL direction (bigint); avoids float threshold flicker. */
const PNL_DIRECTION_NEUTRAL_EPSILON_HUMAN = "0.000001"

function StakingAppBalance({
  onDepositNowClick,
  className,
  fillHeight = false,
  standalone = false,
}: {
  onDepositNowClick?: () => void
  className?: string
  fillHeight?: boolean
  standalone?: boolean
}) {
  const {
    stakedAssets,
    stakingNetPrincipalWei,
    stakingPnlWei,
    tokenDecimals,
    tokenMetaError,
    merchantTokenSymbol,
    executionConnected,
    openWallet,
    isWrongNetwork,
    vaultDataReady,
    stakingPnlBasisReady,
    runtimeWalletConnected,
  } = useStakingVault()
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const {
    data: profitStatus,
    serverOffsetMs,
    hasEverFetchedSuccessfully: profitFetchedOk,
    loading: profitStatusLoading,
  } = useProfitManagerStatus()

  const stakingDeploymentId = activeRuntimeSelection.deployment.id.trim()

  const isTronRuntime = activeRuntimeSelection.deployment.chainFamily === "tron"
  const balanceViewReady =
    runtimeWalletConnected && (isTronRuntime || !isWrongNetwork)

  const displayShareSymbol = publicTokenSymbolLabel(
    merchantTokenSymbol || `M${STAKING_STABLECOIN_LABEL}`
  )

  const principalWei = balanceViewReady ? stakedAssets : 0n
  const displayDecimals =
    tokenDecimals === null ? 8 : Math.max(tokenDecimals, 8)

  const lastStablePnlPartsRef = useRef<{
    depId: string
    parts: { usd: string; pct: string; direction: StakingPnlDirection }
  } | null>(null)

  const prevNextProfitShareRef = useRef<string>("")
  useEffect(() => {
    if (!balanceViewReady) return
    const next = profitStatus.next_profit_share_at
    if (!next) return
    if (
      prevNextProfitShareRef.current &&
      prevNextProfitShareRef.current !== next
    ) {
      notifyStakingRefresh("profit-boundary")
    }
    prevNextProfitShareRef.current = next
  }, [balanceViewReady, profitStatus.next_profit_share_at])


  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const animatedRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const onChange = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const rollingDisplayActive =
    balanceViewReady &&
    principalWei > 0n &&
    tokenDecimals !== null

  const handleOpenWallet = useCallback(() => {
    openWallet()
  }, [openWallet])

  const handleDepositNowClick = useCallback(() => {
    onDepositNowClick?.()
  }, [onDepositNowClick])

  const displayFloat = useRollingStakedDisplayFloat({
    principalWei,
    tokenDecimals,
    profitStatus,
    serverOffsetMs,
    isActive: rollingDisplayActive,
    prefersReducedMotion,
    animatedRef,
  })

  const costBasisFloat = useMemo(
    () =>
      selectCostBasisTokenFloat({
        stakingNetPrincipalWei,
        tokenDecimals,
      }),
    [stakingNetPrincipalWei, tokenDecimals]
  )

  const pnlTokenFloat = useMemo(
    () => selectPnlTokenFloat({ stakingPnlWei, tokenDecimals }),
    [stakingPnlWei, tokenDecimals]
  )

  const balanceActive = balanceViewReady && displayFloat > 0

  if (balanceActive && animatedRef.current === 0) {
    animatedRef.current = displayFloat
  }

  const depositButtonLabel = stakedAssets > 0n ? "Stake more!" : "Stake Now!"

  const pnlParts = useMemo(() => {
    if (!balanceViewReady) return null
    if (
      tokenDecimals === null ||
      stakingPnlWei === null ||
      costBasisFloat === null ||
      pnlTokenFloat === null ||
      stakingNetPrincipalWei === null
    ) {
      return null
    }
    try {
      const basisHuman = costBasisFloat
      const pnlHuman = pnlTokenFloat

      const tokenUsdPrice =
        Number.isFinite(STAKING_PNL_USD_PER_TOKEN) &&
        STAKING_PNL_USD_PER_TOKEN > 0
          ? STAKING_PNL_USD_PER_TOKEN
          : 1

      const neutralAbsWei = parseUnits(
        PNL_DIRECTION_NEUTRAL_EPSILON_HUMAN,
        tokenDecimals,
      )

      const settledResidual = isSettledResidualPosition({
        stakedWei: stakedAssets,
        basisWei: stakingNetPrincipalWei,
        tokenDecimals,
      })

      const direction = getStakingPnlDirectionFromWei(
        stakingPnlWei,
        neutralAbsWei,
      )

      const usdRaw = pnlHuman * tokenUsdPrice
      const usdRawNorm = normalizeSignedZeroDisplay(
        Number.isFinite(usdRaw) ? usdRaw : 0,
      )

      const usdFmt = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      const microUsdFmt = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })

      let usd: string
      if (direction === "neutral") {
        usd = usdFmt.format(0)
      } else if (usdRawNorm > 0 && usdRawNorm < 0.01) {
        usd = `+${microUsdFmt.format(usdRawNorm)}`
      } else if (usdRawNorm < 0 && usdRawNorm > -0.01) {
        usd = microUsdFmt.format(usdRawNorm)
      } else if (usdRawNorm > 0) {
        usd = `+${usdFmt.format(usdRawNorm)}`
      } else if (usdRawNorm < 0) {
        usd = usdFmt.format(usdRawNorm)
      } else {
        usd = usdFmt.format(0)
      }

      const residualDust = isResidualDustStakingPosition(
        stakedAssets,
        stakingNetPrincipalWei,
        tokenDecimals,
      )

      /**
       * ROI is display-only. Color follows `stakingPnlWei` (bigint) only — never ROI.
       * For **settled residual** (`stakedWei === 0`, small positive basis), ROI % is intentionally
       * omitted (empty string): return on fully exited stake vs residual fee basis is not meaningful UX,
       * even though token/USD PnL (e.g. realized fee loss) remains real and visible.
       */
      const pct = selectStakingRoiPercent({
        stakingNetPrincipalWei,
        stakingPnlWei,
        pnlHuman,
        basisHuman,
        direction,
        settledResidual,
        residualDust,
      })

      return {
        usd,
        pct,
        direction,
      }
    } catch {
      return {
        usd: "$0.00",
        pct: "0.00%",
        direction: "neutral" as const,
      }
    }
  }, [
    balanceViewReady,
    tokenDecimals,
    stakedAssets,
    stakingPnlWei,
    costBasisFloat,
    pnlTokenFloat,
    stakingNetPrincipalWei,
  ])

  useEffect(() => {
    const cur = lastStablePnlPartsRef.current
    if (cur && cur.depId !== stakingDeploymentId) {
      lastStablePnlPartsRef.current = null
    }
  }, [stakingDeploymentId])

  useEffect(() => {
    if (pnlParts == null) return
    lastStablePnlPartsRef.current = {
      depId: stakingDeploymentId,
      parts: pnlParts,
    }
  }, [pnlParts, stakingDeploymentId])

  const pnlDisplayForUi =
    pnlParts ??
    (lastStablePnlPartsRef.current?.depId === stakingDeploymentId
      ? lastStablePnlPartsRef.current?.parts ?? null
      : null)

  const pnlClass =
    !balanceViewReady
      ? "text-neutral-500"
      : pnlDisplayForUi?.direction === "positive"
        ? "text-emerald-700"
        : pnlDisplayForUi?.direction === "negative"
          ? "text-red-600"
          : "text-neutral-600"

  const blurPnlUntilBasisReady =
    !isTronRuntime &&
    executionConnected &&
    !isWrongNetwork &&
    tokenDecimals !== null &&
    !tokenMetaError &&
    !stakingPnlBasisReady

  const blurPnlSurface = blurPnlUntilBasisReady && pnlDisplayForUi === null

  const showPnlBlurredPlaceholder =
    !isTronRuntime &&
    executionConnected &&
    !isWrongNetwork &&
    !stakingPnlBasisReady &&
    pnlDisplayForUi === null

  const pnlBlurredAriaLabel = "Profit and loss loading"

  const balanceNumericLoading = isTronRuntime
    ? !vaultDataReady
    : executionConnected && !isWrongNetwork && !vaultDataReady

  const tokenUiBlocked =
    balanceViewReady &&
    vaultDataReady &&
    tokenDecimals === null &&
    !tokenMetaError

  return (
    <div
      className={cn(
        STAKING_BALANCE_LIQUID_CARD,
        "flex min-w-0 flex-row flex-1 items-start justify-between gap-3 p-4 py-6 sm:gap-4 rounded-3xl!",
        !standalone && (fillHeight ? "lg:h-full" : "lg:h-11/12"),
        className
      )}
    >
      <div className='min-w-0 flex-1'>
        <div className='relative px-1'>
          <div className='mb-1.5 flex w-full min-w-0 justify-start sm:mb-2'>
            {/* <StakingAppNetworkChip /> */}
          </div>
          <div
            className={cn(
              tokenUiBlocked &&
                "pointer-events-none select-none"
            )}
          >
            <p className='ps-2 shrink-0 text-[11px] font-normal leading-none tracking-tight text-gray-400 sm:text-[14px] sm:leading-none font-mono'>
              Total balance
            </p>

            <div className='mt-1 flex min-h-9 ps-2 flex-nowrap items-baseline gap-x-1 overflow-x-auto overflow-y-visible transition-opacity duration-200 ease-out sm:min-h-10 sm:gap-x-1.5 sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden'>
              {balanceNumericLoading ? (
                <>
                  <Skeleton className='h-8 w-36 max-w-[70%] rounded-3xl bg-neutral-200/80 sm:h-8' />
                  <Skeleton className='inline-block h-5 w-10 rounded-3xl bg-neutral-200/80 sm:h-6 sm:w-12' />
                </>
              ) : (
                <>
                  <RollingTokenAmount
                    valueRef={animatedRef}
                    principalFloat={displayFloat}
                    decimals={displayDecimals}
                    className='font-mono text-2xl leading-none font-light tracking-tight text-black tabular-nums sm:text-3xl'
                    active={balanceActive}
                    reducedMotion={prefersReducedMotion}
                    staticValue={prefersReducedMotion ? displayFloat : undefined}
                    resetKey={`${principalWei.toString()}-${displayDecimals}`}
                  />
                  <span className='inline-flex shrink-0 items-baseline text-[11px] font-normal leading-none tracking-tight text-gray-400 sm:text-[20px] sm:leading-none font-mono'>
                    {displayShareSymbol}
                  </span>
                </>
              )}
            </div>

            <div className='mt-0 ps-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-sm'>
              <span className='inline-flex shrink-0 items-baseline text-[11px] font-normal leading-none tracking-tight text-gray-400 sm:text-[14px] sm:leading-none font-mono'>PnL</span>
              {!balanceViewReady ? (
                <span className='text-neutral-500'>—</span>
              ) : balanceNumericLoading ? (
                <Skeleton className='inline-block h-4 w-28 rounded-3xl bg-neutral-200/80' />
              ) : showPnlBlurredPlaceholder ? (
                <span
                  className={cn(
                    "inline-flex min-w-0 flex-wrap items-baseline gap-x-2 tabular-nums text-neutral-500",
                  )}
                  aria-busy
                  aria-live='polite'
                  aria-label={pnlBlurredAriaLabel}
                >
                  <span>$0.00</span>
                  <span>0.00%</span>
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex min-w-0 flex-wrap items-baseline gap-x-2 tabular-nums",
                    pnlClass,
                    blurPnlSurface &&
                      "blur-[2px] select-none motion-reduce:blur-none motion-reduce:opacity-50"
                  )}
                  aria-busy={blurPnlSurface ? true : undefined}
                  aria-live={blurPnlSurface ? "polite" : undefined}
                  aria-label={
                    blurPnlSurface
                      ? "Loading profit and loss basis"
                      : undefined
                  }
                >
                  <span>{pnlDisplayForUi?.usd ?? "—"}</span>
                  <span>{pnlDisplayForUi?.pct ?? ""}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className='mt-3 ps-2 flex min-h-7 items-center hidden'>
          {!isTronRuntime && !executionConnected ? (
            <Button
              size='sm'
              className='font-mono text-xs'
              type='button'
              onClick={handleOpenWallet}
            >
              Connect wallet
            </Button>
          ) : !isTronRuntime && executionConnected && isWrongNetwork ? (
            <Button
              size='sm'
              className='font-mono text-xs h-7!'
              type='button'
              disabled
              aria-label={`Wrong network. Switch your wallet to ${activeRuntimeSelection.deployment.labels.network}.`}
            >
              Wrong network
            </Button>
          ) : (
            <Button
              size='sm'
              className='h-7! w-fit px-2.5 font-mono text-xs'
              type='button'
              disabled={tokenUiBlocked || balanceNumericLoading}
              onClick={handleDepositNowClick}
            >
              {depositButtonLabel}
            </Button>
          )}
        </div>
      </div>
      {profitStatusLoading && !profitFetchedOk ? (
        <Skeleton className='size-18 shrink-0 rounded-full bg-neutral-200/80 sm:size-22' />
      ) : (
        <StakingApyBadge
          variant='compact'
          displayPercent={Math.round(profitStatus.apy_percentage)}
          degraded={!profitFetchedOk}
        />
      )}
    </div>
  )
}

export default StakingAppBalance
