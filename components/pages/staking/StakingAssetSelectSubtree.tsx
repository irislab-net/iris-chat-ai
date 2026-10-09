import { StakingTokenIcon } from "@/components/pages/staking/StakingTokenIcon"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STAKING_NETWORK_LABEL } from "@/constants/stakingVaultConfig"
import {
  buildStakingProductNetworkSelectorRows,
  chainFamilyOrEvm,
  countStakingProductNetworkSelectorDeploymentRows,
  STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER,
  STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER,
  stakingProductNetworkSelectorItemValue,
} from "@/lib/stakingProduct/stakingProductRouting"
import { STAKING_SELECT_TRIGGER } from "@/staking/ui"
import { cn } from "@/lib/utils"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { createActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  useActiveRuntimeSelection,
  useInternalRuntimeSwapForTesting,
  useRuntimeTransitionControllerState,
} from "@/staking/core/runtimeSelectionContext"
import { isRuntimeSwapEntryAllowed } from "@/staking/orchestration"
import { isCfg6StakingRuntimeDisabledSentinel } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import { useCallback, useEffect, useId, useMemo, useRef } from "react"

/** Fixed layout shell: matches trigger row (icon + two text tracks) without content-driven width. */
const ASSET_SELECT_TRIGGER_SKELETON_ROW_CLASS =
  "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"

const ASSET_ITEM_INNER_CLASS = "flex min-w-0 items-center gap-1.5"
const ASSET_ITEM_LABEL_CLASS = "truncate leading-none text-foreground"
const ASSET_ITEM_META_CLASS =
  "shrink-0 text-[11px] font-normal leading-none text-muted-foreground"

const SOON_BADGE_CLASS =
  "shrink-0 rounded-full bg-neutral-200/70 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-neutral-500/90"

export type StakingAssetSelectSubtreeProps = {
  disabled: boolean
  label: string
  variant: "deposit" | "withdraw"
  /** Product hint when only one network row is shown. Defaults to `STAKING_NETWORK_LABEL`. */
  poolNetworkLabel?: string
}

function assetItemInner(symbol: string, networkLine: string) {
  return (
    <span className={ASSET_ITEM_INNER_CLASS}>
      <span className={ASSET_ITEM_LABEL_CLASS}>{symbol}</span>
      <span className={ASSET_ITEM_META_CLASS}>{networkLine}</span>
    </span>
  )
}

/**
 * Token + network row for stake/unstake forms. Matches the balance-card network chip: when multiple
 * deployments exist and runtime switching is enabled, changing the row swaps passive staking runtime.
 */
export function StakingAssetSelectSubtree({
  disabled,
  label,
  poolNetworkLabel,
  variant,
}: StakingAssetSelectSubtreeProps) {
  const fieldId = useId()
  const fieldLabelId = useId()
  const fieldLabel =
    variant === "deposit" ? "Asset to deposit" : "Token to withdraw"
  const active = useActiveRuntimeSelection()
  const {
    openWallet,
    refreshBalances,
    refreshStakingHistory,
    runtimeWalletConnected,
    isWrongNetwork,
    tokenAddress,
    tokenDecimals,
    tokenMetaError,
    tokenMetaFetched,
    tokenSymbol,
  } = useStakingVault()

  const showAssetSkeleton = useMemo(() => {
    if (tokenMetaError != null) return true

    const isTronDeployment = active.deployment.chainFamily === "tron"
    const addr = tokenAddress?.trim() ?? ""

    if (isTronDeployment) {
      if (!addr) return true
      if (!tokenMetaFetched) return true
      if (!tokenSymbol.trim() || tokenDecimals === null) return true
      return false
    }

    const walletReady = runtimeWalletConnected
    if (!walletReady || isWrongNetwork) return false
    if (!addr) return true
    if (!tokenMetaFetched) return true
    if (!tokenSymbol.trim() || tokenDecimals === null) return true
    return false
  }, [
    tokenMetaError,
    active.deployment.chainFamily,
    tokenAddress,
    tokenMetaFetched,
    tokenSymbol,
    tokenDecimals,
    runtimeWalletConnected,
    isWrongNetwork,
  ])
  const swapTo = useInternalRuntimeSwapForTesting()
  const transitionController = useRuntimeTransitionControllerState()
  const assetSwapCooldownRef = useRef(false)
  const assetSwapCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(
    () => () => {
      if (assetSwapCooldownTimerRef.current != null) {
        clearTimeout(assetSwapCooldownTimerRef.current)
        assetSwapCooldownTimerRef.current = null
      }
      assetSwapCooldownRef.current = false
    },
    []
  )

  const deploymentById = useMemo(
    () =>
      new Map(
        getStakingDeploymentRegistry().deployments.map(
          d => [d.id.trim(), d] as const
        )
      ),
    []
  )
  const registry = getStakingDeploymentRegistry()
  const selectorRows = buildStakingProductNetworkSelectorRows(registry)

  const deploymentRowCount = countStakingProductNetworkSelectorDeploymentRows(selectorRows)
  const multiSwapTargets = deploymentRowCount > 1

  const swapEntryOpen = isRuntimeSwapEntryAllowed(transitionController)
  /** Menu opens whenever transition allows; runtime swaps still require `swapTo` + 2+ deployments. */
  const assetMenuInteractive = swapEntryOpen
  const assetSelectInteractive = assetMenuInteractive && !disabled

  const selectValue = (() => {
    if (isCfg6StakingRuntimeDisabledSentinel(active.deployment)) {
      return STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER
    }
    const id = active.deployment.id.trim()
    const inRows = selectorRows.some(
      r => r.kind === "deployment" && r.choice.deploymentId.trim() === id
    )
    if (inRows) return id
    const fam = chainFamilyOrEvm(active.deployment.chainFamily)
    const byFam = selectorRows.find(
      r => r.kind === "deployment" && chainFamilyOrEvm(r.choice.chainFamily) === fam
    )
    if (byFam && byFam.kind === "deployment") {
      return byFam.choice.deploymentId.trim()
    }
    return fam === "tron"
      ? STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER
      : STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER
  })()

  const networkLine = useMemo(() => {
    return (
      active.deployment.labels.network.trim() ||
      poolNetworkLabel?.trim() ||
      STAKING_NETWORK_LABEL
    )
  }, [active.deployment.labels.network, poolNetworkLabel])

  const handleTokenNetworkChange = useCallback(
    (nextId: string) => {
      if (!swapTo || !swapEntryOpen) return
      const tid = nextId.trim()
      if (
        tid === STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER ||
        tid === STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER
      ) {
        return
      }
      if (!multiSwapTargets) return
      const cur = active.deployment.id.trim()
      if (tid === cur) return
      if (assetSwapCooldownRef.current) return
      const deployment = deploymentById.get(tid)
      if (!deployment) return
      assetSwapCooldownRef.current = true
      if (assetSwapCooldownTimerRef.current != null) {
        clearTimeout(assetSwapCooldownTimerRef.current)
      }
      swapTo({ nextRuntime: createActiveRuntimeSelection(deployment) })
      if (deployment.chainFamily === "tron" && !runtimeWalletConnected) {
        openWallet()
      }
      queueMicrotask(() => {
        refreshBalances()
        void refreshStakingHistory({ shallow: true, skipIfInFlight: true })
      })
      assetSwapCooldownTimerRef.current = setTimeout(() => {
        assetSwapCooldownTimerRef.current = null
        assetSwapCooldownRef.current = false
      }, 180)
    },
    [
      swapTo,
      swapEntryOpen,
      multiSwapTargets,
      deploymentById,
      active.deployment.id,
      runtimeWalletConnected,
      openWallet,
      refreshBalances,
      refreshStakingHistory,
    ]
  )

  const selectDisabled = !assetSelectInteractive

  if (showAssetSkeleton) {
    return (
      <div className='w-full min-w-0 space-y-2'>
        {/* Not a <label>: skeleton has no labelable control yet — avoids a11y "label without field". */}
        <div
          id={fieldLabelId}
          className='select-none text-xs font-light leading-tight text-neutral-600'
        >
          {fieldLabel}
        </div>
        <div
          id={fieldId}
          aria-labelledby={fieldLabelId}
          aria-busy='true'
          aria-live='polite'
          className={cn(
            STAKING_SELECT_TRIGGER,
            "pointer-events-none cursor-default",
            disabled && "opacity-60"
          )}
        >
          <span className={ASSET_SELECT_TRIGGER_SKELETON_ROW_CLASS}>
            <Skeleton className='size-5 shrink-0 rounded-full' />
            <Skeleton className='h-3.5 w-13 shrink-0 rounded-sm sm:h-3 sm:w-14' />
            <Skeleton className='h-3 w-22 max-w-[42%] shrink-0 rounded-sm sm:h-2.5 sm:w-24' />
          </span>
          <span className='size-4 shrink-0' aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-w-0 space-y-2'>
      <Label
        id={fieldLabelId}
        htmlFor={fieldId}
        className='text-xs font-light text-neutral-600 hidden'
      >
        {fieldLabel}
      </Label>
      <Select
        value={selectValue}
        onValueChange={handleTokenNetworkChange}
        disabled={selectDisabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-label={`${fieldLabel}: ${label} on ${networkLine}`}
          aria-labelledby={fieldLabelId}
          className={cn(
            STAKING_SELECT_TRIGGER,
            "min-w-48 sm:min-w-54",
            (disabled || selectDisabled) && "opacity-60",
            "[&>span_svg]:text-muted-foreground/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0",
            "**:data-[slot=select-value]:min-w-0 **:data-[slot=select-value]:items-center [&_[data-slot=select-value]_img]:shrink-0 [&_[data-slot=select-value]_img]:self-center"
          )}
        >
          <SelectValue
            placeholder={label.trim() || "Select token"}
            className='min-w-0 truncate text-start'
          />
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={e => e.preventDefault()}
          className={cn(
            "max-h-72",
            "[&_[data-slot=select-item]_img]:shrink-0 [&_[data-slot=select-item]_img]:rounded-full",
            "[&_[data-slot=select-item]>span_svg]:text-muted-foreground/80 [&_[data-slot=select-item]>span_svg]:shrink-0",
            "[&_[data-slot=select-item][data-disabled]]:cursor-not-allowed [&_[data-slot=select-item][data-disabled]]:opacity-55",
            "[&_[data-slot=select-item][data-disabled]]:hover:bg-transparent [&_[data-slot=select-item][data-disabled][data-highlighted]]:bg-transparent"
          )}
        >
          {selectorRows.map(row => {
            const itemValue = stakingProductNetworkSelectorItemValue(row)
            if (row.kind === "placeholder") {
              const fam = row.chainFamily
              const rowNetwork = fam === "tron" ? "Tron" : "Ethereum"
              return (
                <SelectItem
                  key={itemValue}
                  value={itemValue}
                  disabled
                  textValue={`${label} ${rowNetwork}`}
                  className='cursor-not-allowed opacity-80'
                >
                  <StakingTokenIcon
                    symbol={label}
                    sizeClassName='size-5 shrink-0 opacity-80'
                    chainFamily={fam}
                  />
                  <span
                    className={cn(
                      ASSET_ITEM_INNER_CLASS,
                      "min-w-0 flex-1 items-center justify-between gap-2"
                    )}
                  >
                    <span className={ASSET_ITEM_LABEL_CLASS}>{label}</span>
                    <span className='flex shrink-0 items-center gap-1.5'>
                      <span className={ASSET_ITEM_META_CLASS}>{rowNetwork}</span>
                      {row.rolloutDisabled ? (
                        <span className={SOON_BADGE_CLASS}>Soon</span>
                      ) : null}
                    </span>
                  </span>
                </SelectItem>
              )
            }
            const id = row.choice.deploymentId.trim()
            const dep = deploymentById.get(id)
            if (!dep) return null
            const rowNetwork =
              dep.labels.network.trim() ||
              row.choice.networkLabel.trim() ||
              poolNetworkLabel?.trim() ||
              STAKING_NETWORK_LABEL
            return (
              <SelectItem
                key={id}
                value={id}
                textValue={`${label} ${rowNetwork}`}
              >
                <StakingTokenIcon
                  symbol={label}
                  sizeClassName='size-5 shrink-0'
                  chainFamily={dep.chainFamily}
                />
                {assetItemInner(label, rowNetwork)}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

export function StakingDepositAssetSelect(props: {
  disabled: boolean
  label: string
  poolNetworkLabel?: string
}) {
  return <StakingAssetSelectSubtree variant='deposit' {...props} />
}

export function StakingWithdrawAssetSelect(props: {
  disabled: boolean
  label: string
  poolNetworkLabel?: string
}) {
  return <StakingAssetSelectSubtree variant='withdraw' {...props} />
}
