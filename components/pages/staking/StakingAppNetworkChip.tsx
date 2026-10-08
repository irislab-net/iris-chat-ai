import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  STAKING_GLASS_INNER,
  STAKING_SEGMENT_LIQUID_ACTIVE,
  STAKING_SEGMENT_LIQUID_BASE,
  STAKING_SEGMENT_LIQUID_TRACK,
} from "@/components/pages/staking/stakingGlassPanel"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { resolveStakingChainBadgeUrl } from "@/lib/stakingChainBadgeVisuals"
import {
  buildStakingProductNetworkSelectorRows,
  chainFamilyOrEvm,
  countStakingProductNetworkSelectorDeploymentRows,
  STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER,
  STAKING_NETWORK_SELECTOR_VALUE_TRON_PLACEHOLDER,
  stakingProductNetworkSelectorItemValue,
} from "@/lib/stakingProduct/stakingProductRouting"
import { cn } from "@/lib/utils"
import { createActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  useInternalRuntimeSwapForTesting,
  useRuntimeTransitionControllerState,
} from "@/staking/core/runtimeSelectionContext"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { isCfg6StakingRuntimeDisabledSentinel } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import { isRuntimeSwapEntryAllowed } from "@/staking/orchestration"
import type { ChainFamily } from "@/staking/core/types"
import { useCallback, useEffect, useId, useMemo, useRef } from "react"

function networkPickerLabel(chainFamily: ChainFamily): "Ethereum" | "Tron" {
  return chainFamily === "tron" ? "Tron" : "Ethereum"
}

const SOON_BADGE_CLASS =
  "shrink-0 rounded-full bg-neutral-200/70 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-neutral-500/90"

/** Compact network chip — same glass track as form tabs, without tab `flex-1` stretch. */
const NETWORK_SEGMENT_SHELL = cn(
  "inline-flex w-fit max-w-full shrink-0 self-start !p-1",
  STAKING_SEGMENT_LIQUID_TRACK
)

const NETWORK_SEGMENT_TRIGGER = cn(
  STAKING_SEGMENT_LIQUID_BASE,
  "!flex-none !grow-0 !shrink-0 min-w-0 w-fit max-w-full items-center justify-start gap-1",
  "!h-8 min-h-8 !px-2 !py-1 text-xs font-semibold tracking-tight text-neutral-900",
  "outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
  "[&>svg:last-child]:pointer-events-none [&>svg:last-child]:shrink-0 [&>svg:last-child]:size-3 [&>svg:last-child]:text-neutral-500",
  "[&_img[data-slot=avatar-image]]:shrink-0 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:gap-2"
)

/**
 * Primary network control — compact chip above **Total Balance** inside the balance card.
 * Switching logic matches the former balance-subtitle picker; no coordinator/orchestrator changes.
 */
export function StakingAppNetworkChip() {
  const { refreshBalances, refreshStakingHistory } = useStakingVault()
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const swapTo = useInternalRuntimeSwapForTesting()
  const transitionController = useRuntimeTransitionControllerState()
  const networkSelectId = useId()
  const networkSwapCooldownRef = useRef(false)
  const networkSwapCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  useEffect(
    () => () => {
      if (networkSwapCooldownTimerRef.current != null) {
        clearTimeout(networkSwapCooldownTimerRef.current)
        networkSwapCooldownTimerRef.current = null
      }
      networkSwapCooldownRef.current = false
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
  /** Opening the menu is allowed whenever transitions permit it; swaps still require `swapTo`. */
  const networkSelectInteractive = swapEntryOpen

  const networkSelectValue = (() => {
    const dep = activeRuntimeSelection.deployment
    if (isCfg6StakingRuntimeDisabledSentinel(dep)) {
      return STAKING_NETWORK_SELECTOR_VALUE_EVM_PLACEHOLDER
    }
    const id = dep.id.trim()
    const inRows = selectorRows.some(
      r => r.kind === "deployment" && r.choice.deploymentId.trim() === id
    )
    if (inRows) return id
    const fam = chainFamilyOrEvm(dep.chainFamily)
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

  const handleNetworkSelectChange = useCallback(
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
      const cur = activeRuntimeSelection.deployment.id.trim()
      if (tid === cur) return
      if (networkSwapCooldownRef.current) return
      const deployment = deploymentById.get(tid)
      if (!deployment) return
      networkSwapCooldownRef.current = true
      if (networkSwapCooldownTimerRef.current != null) {
        clearTimeout(networkSwapCooldownTimerRef.current)
      }
      swapTo({ nextRuntime: createActiveRuntimeSelection(deployment) })
      queueMicrotask(() => {
        refreshBalances()
        void refreshStakingHistory({ shallow: true, skipIfInFlight: true })
      })
      networkSwapCooldownTimerRef.current = setTimeout(() => {
        networkSwapCooldownTimerRef.current = null
        networkSwapCooldownRef.current = false
      }, 180)
    },
    [
      swapTo,
      swapEntryOpen,
      multiSwapTargets,
      deploymentById,
      activeRuntimeSelection.deployment.id,
      refreshBalances,
      refreshStakingHistory,
    ]
  )

  return (
    <div className='flex w-fit max-w-full min-w-0 items-center justify-start'>
      <Select
        value={networkSelectValue}
        onValueChange={handleNetworkSelectChange}
        disabled={!networkSelectInteractive}
      >
        <div className={NETWORK_SEGMENT_SHELL}>
          <SelectTrigger
            id={networkSelectId}
            size='sm'
            aria-label='Staking network'
            className={cn(
              NETWORK_SEGMENT_TRIGGER,
              STAKING_SEGMENT_LIQUID_ACTIVE,
              "shadow-none disabled:cursor-not-allowed disabled:opacity-100",
              "disabled:brightness-[0.98] disabled:saturate-75 disabled:contrast-[0.97]",
              "disabled:[&>svg:last-child]:text-neutral-400/75",
              "enabled:cursor-pointer enabled:data-[state=open]:brightness-[1.01]",
              "enabled:focus-visible:ring-white/55"
            )}
          >
            <SelectValue placeholder='…' />
          </SelectTrigger>
        </div>
        <SelectContent
          align='start'
          onCloseAutoFocus={e => e.preventDefault()}
          className={cn(
            STAKING_GLASS_INNER,
            "min-w-[var(--radix-select-trigger-width)] max-w-[min(100vw-2rem,20rem)] border border-neutral-200/85 bg-white/96 p-1 shadow-lg backdrop-blur-md",
            "[&_[data-slot=select-item]]:rounded-[14px] [&_[data-slot=select-item]]:py-2",
            "[&_[data-slot=select-item-indicator]]:right-2 [&_[data-slot=select-item-indicator]]:left-auto",
            "[&_[data-slot=select-item][data-disabled]]:cursor-not-allowed [&_[data-slot=select-item][data-disabled]]:opacity-55",
            "[&_[data-slot=select-item][data-disabled]]:hover:bg-transparent [&_[data-slot=select-item][data-disabled][data-highlighted]]:bg-transparent"
          )}
        >
          {selectorRows.map(row => {
            const itemValue = stakingProductNetworkSelectorItemValue(row)
            if (row.kind === "placeholder") {
              const fam = row.chainFamily
              const src = resolveStakingChainBadgeUrl(fam)
              const label = networkPickerLabel(fam)
              return (
                <SelectItem
                  key={itemValue}
                  value={itemValue}
                  disabled
                  textValue={label}
                  className="cursor-not-allowed"
                >
                  <Avatar className='size-5 shrink-0 opacity-80'>
                    <AvatarImage src={src} alt='' decoding='async' />
                    <AvatarFallback className='text-[9px] font-semibold'>
                      {fam === "tron" ? "T" : "E"}
                    </AvatarFallback>
                  </Avatar>
                  <span className='flex min-w-0 flex-1 items-center justify-between gap-2'>
                    <span className='truncate text-xs font-medium text-neutral-700'>
                      {label}
                    </span>
                    {row.rolloutDisabled ? (
                      <span className={SOON_BADGE_CLASS}>Soon</span>
                    ) : null}
                  </span>
                </SelectItem>
              )
            }
            const id = row.choice.deploymentId.trim()
            const fam = chainFamilyOrEvm(row.choice.chainFamily)
            const src = resolveStakingChainBadgeUrl(fam)
            const label = networkPickerLabel(fam)
            return (
              <SelectItem key={id} value={id} textValue={label}>
                <Avatar className='size-5 shrink-0'>
                  <AvatarImage src={src} alt='' decoding='async' />
                  <AvatarFallback className='text-[9px] font-semibold'>
                    {fam === "tron" ? "T" : "E"}
                  </AvatarFallback>
                </Avatar>
                <span className='min-w-0 flex-1 truncate text-xs font-medium text-neutral-800'>
                  {label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
