"use client"
import { chatMobilePrimaryButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import GlowingButton from "@/components/common/glowingButton"
import { Button } from "@/components/ui/button"
import useWallet from "@/hooks/useWallet"
import { usePreservedNavigate } from "@/hooks/usePreservedNavigate"
import {
  useUnifiedWalletOrchestration,
  type UnifiedWalletRuntimeNamespace,
} from "@/staking/orchestration"
import { passiveTronWrongNetworkNavbarLabel } from "@/staking/identity"
import { formatStakingRuntimeWalletShort } from "@/staking/identity"
import {
  usePublishedStakingRuntimeWalletIdentity,
  type StakingRuntimeWalletIdentitySnapshot,
} from "@/staking/identity"
import {
  inferNavbarDisconnectReason,
  isConfirmedStakingRuntimeDisconnect,
  isTransientNavbarVisualGap,
  STAKING_NAV_VISUAL_HOLD_MS,
  traceNavbarWalletDisconnectDev,
  type NavbarVisualCacheKey,
  type NavbarVisualHoldSnapshot,
} from "@/staking/identity"
import { cn } from "@/lib/utils"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import type { ChainFamily } from "@/staking/core/types"
import { ChevronDown, Loader2, Wallet } from "lucide-react"
import { isStakingAppPathname } from "@/lib/staking/stakingRoute"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"

const NAVBAR_WALLET_FALLBACK_LABEL = "Wallet"

type NavbarWalletRenderBranch = "loading" | "connected" | "disconnected"

function useStakingNavFlags() {
  const pathname = usePathname() ?? "/"
  return {
    isStakingApp: isStakingAppPathname(pathname),
    isHomeLandingPage: pathname === "/" || pathname === "",
  }
}

function useStakingTronDeploymentCaip2(chainFamily: string): string | null {
  return useMemo(() => {
    if (chainFamily !== "tron") return null
    try {
      const row = getStakingDeploymentRegistry().deployments.find(
        d => d.chainFamily === "tron"
      )
      return row?.caip2.trim() ?? null
    } catch {
      return null
    }
  }, [chainFamily])
}

function runtimeNamespaceForChainFamily(
  chainFamily: string
): UnifiedWalletRuntimeNamespace {
  return chainFamily === "tron" ? "tron" : "eip155"
}

/** Visual-only: premium chip when runtime has a displayable account (Tron includes wrong-network). */
function stakingNavShowAsConnected(
  runtime: Pick<
    StakingRuntimeWalletIdentitySnapshot,
    "chainFamily" | "connected" | "hasAccount"
  >
): boolean {
  if (runtime.chainFamily === "tron") {
    return runtime.hasAccount || runtime.connected
  }
  return runtime.connected
}

function resolveNavbarChipLabel(
  displayShortAddress: string,
  runtimeAddress: string | null | undefined,
  showAsConnected: boolean,
  hasAccount: boolean
): string {
  if (!showAsConnected) return ""
  const fromDisplay = displayShortAddress.trim()
  if (fromDisplay) return fromDisplay
  if (hasAccount) {
    const fromRuntime = formatStakingRuntimeWalletShort(runtimeAddress)
    if (fromRuntime) return fromRuntime
  }
  return NAVBAR_WALLET_FALLBACK_LABEL
}

function useStakingNavbarVisualIdentity(
  enabled: boolean,
  runtime: StakingRuntimeWalletIdentitySnapshot,
  appKitShortAddress: string,
  appKitConnected: boolean
): Readonly<{
  showAsConnected: boolean
  displayShortAddress: string
  runtimeAddress: string | null
  hasAccount: boolean
  runtimeConnected: boolean
}> {
  const lastStableVisualRef = useRef<NavbarVisualHoldSnapshot | null>(null)
  const prevChainFamilyRef = useRef<ChainFamily | null>(null)
  const prevHadVisualAccountRef = useRef(false)

  if (!enabled) {
    return {
      showAsConnected: appKitConnected,
      displayShortAddress: appKitShortAddress.trim(),
      runtimeAddress: null,
      hasAccount: appKitConnected,
      runtimeConnected: appKitConnected,
    }
  }

  if (prevChainFamilyRef.current !== runtime.chainFamily) {
    lastStableVisualRef.current = null
    prevChainFamilyRef.current = runtime.chainFamily
  }

  const rawShowAsConnected = stakingNavShowAsConnected(runtime)
  const formattedRuntime = formatStakingRuntimeWalletShort(runtime.address)
  const rawAddress = (runtime.shortAddress?.trim() || formattedRuntime).trim()
  const confirmedDisconnect = isConfirmedStakingRuntimeDisconnect(runtime)
  const hadVisualAccount = prevHadVisualAccountRef.current
  const transientGap = isTransientNavbarVisualGap(
    runtime,
    rawShowAsConnected,
    rawAddress
  )

  let showAsConnected = rawShowAsConnected
  let displayShortAddress = rawAddress

  if (rawShowAsConnected) {
    showAsConnected = true
    displayShortAddress = rawAddress
    if (rawAddress) {
      lastStableVisualRef.current = {
        shortAddress: rawAddress,
        chainFamily: runtime.chainFamily,
        atMs: performance.now(),
      }
    }
  } else if (confirmedDisconnect) {
    const clearedCaches: NavbarVisualCacheKey[] = [
      "displayShortAddress",
      "lastStableVisualRef",
      "showAsConnected",
    ]
    lastStableVisualRef.current = null
    showAsConnected = false
    displayShortAddress = ""
    const reason = inferNavbarDisconnectReason(runtime, hadVisualAccount)
    if (hadVisualAccount) {
      traceNavbarWalletDisconnectDev({
        disconnectDetected: true,
        reason,
        clearedVisualCaches: clearedCaches,
        runtimeKey: runtime.runtimeKey ?? null,
        chainFamily: runtime.chainFamily,
      })
    }
  } else if (transientGap) {
    const hold = lastStableVisualRef.current
    const holdFresh =
      hold != null &&
      hold.chainFamily === runtime.chainFamily &&
      performance.now() - hold.atMs < STAKING_NAV_VISUAL_HOLD_MS

    if (holdFresh && hold.shortAddress) {
      showAsConnected = true
      displayShortAddress = hold.shortAddress
    } else if (runtime.hasAccount) {
      showAsConnected = true
      displayShortAddress =
        rawAddress || formatStakingRuntimeWalletShort(runtime.address)
    } else {
      lastStableVisualRef.current = null
      showAsConnected = false
      displayShortAddress = ""
    }
  } else {
    lastStableVisualRef.current = null
    showAsConnected = false
    displayShortAddress = ""
  }

  prevHadVisualAccountRef.current =
    runtime.hasAccount || runtime.connected || rawShowAsConnected

  return {
    showAsConnected,
    displayShortAddress,
    runtimeAddress: confirmedDisconnect ? null : runtime.address,
    hasAccount: runtime.hasAccount,
    runtimeConnected: runtime.connected,
  }
}

function useNavbarWalletDevTrace(
  model: Readonly<{
    renderBranch: NavbarWalletRenderBranch
    showAsConnected: boolean
    displayShortAddress: string
    chipLabel: string
    runtimeAddress: string | null
    hasAccount: boolean
    runtimeConnected: boolean
    size: "default" | "sm"
  }>
): void {
  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    console.debug("[navbar-wallet-render]", {
      renderBranch: model.renderBranch,
      showAsConnected: model.showAsConnected,
      displayShortAddress: model.displayShortAddress,
      chipLabel: model.chipLabel,
      runtimeAddress: model.runtimeAddress,
      hasAccount: model.hasAccount,
      runtimeConnected: model.runtimeConnected,
      size: model.size,
      subtreeRendered: true,
    })
  }, [
    model.renderBranch,
    model.showAsConnected,
    model.displayShortAddress,
    model.chipLabel,
    model.runtimeAddress,
    model.hasAccount,
    model.runtimeConnected,
    model.size,
  ])
}

function useStakingAppNavbarWallet() {
  const { isStakingApp } = useStakingNavFlags()
  const appKit = useWallet()
  const runtime = usePublishedStakingRuntimeWalletIdentity(isStakingApp)
  const tronCaip2 = useStakingTronDeploymentCaip2(runtime.chainFamily)

  const useRuntimeIdentity = isStakingApp
  const namespace = runtimeNamespaceForChainFamily(runtime.chainFamily)

  const operationallyConnected = useRuntimeIdentity
    ? runtime.connected
    : appKit.isConnected

  const visual = useStakingNavbarVisualIdentity(
    useRuntimeIdentity,
    runtime,
    appKit.shortAddress,
    appKit.isConnected
  )

  const isLoading = useRuntimeIdentity ? false : appKit.isLoading
  const tronWrongNetwork =
    useRuntimeIdentity &&
    runtime.chainFamily === "tron" &&
    runtime.hasAccount &&
    !runtime.networkOk

  const orchestration = useUnifiedWalletOrchestration({
    namespace,
    connected: operationallyConnected,
    wrongNetwork: tronWrongNetwork,
  })

  const openWallet = useCallback(() => {
    if (!isStakingApp) {
      appKit.open()
      return
    }
    orchestration.openWallet()
  }, [isStakingApp, appKit, orchestration])

  const disconnectedLabel = useMemo(() => {
    if (tronWrongNetwork && tronCaip2) {
      return passiveTronWrongNetworkNavbarLabel(tronCaip2)
    }
    return "Connect Wallet"
  }, [tronWrongNetwork, tronCaip2])

  const chipLabel = useMemo(
    () =>
      resolveNavbarChipLabel(
        visual.displayShortAddress,
        visual.runtimeAddress,
        visual.showAsConnected,
        visual.hasAccount
      ),
    [
      visual.displayShortAddress,
      visual.runtimeAddress,
      visual.showAsConnected,
      visual.hasAccount,
    ]
  )

  return {
    openWallet,
    isLoading,
    showAsConnected: visual.showAsConnected,
    displayShortAddress: visual.displayShortAddress,
    chipLabel,
    disconnectedLabel,
    showChevron: visual.showAsConnected,
    tronWrongNetwork,
    runtimeAddress: visual.runtimeAddress,
    hasAccount: visual.hasAccount,
    runtimeConnected: visual.runtimeConnected,
  }
}

type NavbarWalletSubtreeProps = Readonly<{
  openWallet: () => void
  isLoading: boolean
  showAsConnected: boolean
  displayShortAddress: string
  chipLabel: string
  disconnectedLabel: string
  showChevron: boolean
  tronWrongNetwork: boolean
  runtimeAddress: string | null
  hasAccount: boolean
  runtimeConnected: boolean
  size: "default" | "sm"
}>

function NavbarWalletButtonSubtree(props: NavbarWalletSubtreeProps) {
  const {
    openWallet,
    isLoading,
    showAsConnected,
    displayShortAddress,
    chipLabel,
    disconnectedLabel,
    showChevron,
    tronWrongNetwork,
    runtimeAddress,
    hasAccount,
    runtimeConnected,
    size,
  } = props

  const warningVisual = Boolean(tronWrongNetwork && showAsConnected)

  const renderBranch: NavbarWalletRenderBranch = isLoading
    ? "loading"
    : showAsConnected
      ? "connected"
      : "disconnected"

  useNavbarWalletDevTrace({
    renderBranch,
    showAsConnected,
    displayShortAddress,
    chipLabel,
    runtimeAddress,
    hasAccount,
    runtimeConnected,
    size,
  })

  const title = tronWrongNetwork
    ? "Switch network in wallet"
    : showAsConnected
      ? "Open wallet account"
      : undefined

  const connectedWalletIconClass = cn(
    "text-neutral-400 shrink-0",
    warningVisual && "text-amber-600/90"
  )

  const connectedChipClass = cn(warningVisual && "text-amber-950/90")

  const outlineWarningClass = cn(
    warningVisual && "border-amber-500/45 ring-1 ring-amber-500/20"
  )

  const connectedChipContent = (
    <>
      <Wallet className={cn(size === "sm" ? "size-3.5" : "size-4", connectedWalletIconClass)} />
      <span
        className={cn(
          "group-hover:animate-pressed transition-[transform,opacity] duration-300",
          size === "default" && "font-light",
          connectedChipClass
        )}
      >
        {chipLabel}
      </span>
      {showChevron ? (
        <ChevronDown
          className={cn(
            "shrink-0 group-hover:animate-pressed",
            size === "sm" ? "size-3.5" : "size-4",
            warningVisual ? "text-amber-700/80" : size === "sm" ? "text-neutral-600" : "text-neutral-400"
          )}
        />
      ) : null}
    </>
  )

  /** Disconnected: Exur liquid-blue capsule; connected: quiet outline chip. */
  const emphasizeConnect = !showAsConnected
  const liquidConnectClass = cn(
    chatMobilePrimaryButtonClass,
    "h-10 min-h-10 rounded-full px-3.5 font-semibold text-white hover:text-white"
  )

  const disconnectedChipContent = (
    <span className='group-hover:animate-pressed transition-[transform,opacity] duration-300'>
      {disconnectedLabel}
    </span>
  )

  const loadingContent = (
    <>
      <Loader2
        className={cn(
          "animate-spin shrink-0",
          size === "sm" ? "size-3.5" : "size-4",
          emphasizeConnect && "text-white/90"
        )}
      />
      <span className='group-hover:animate-pressed transition-[transform,opacity] duration-300'>
        Connecting...
      </span>
    </>
  )

  const innerContent = isLoading
    ? loadingContent
    : showAsConnected
      ? connectedChipContent
      : disconnectedChipContent

  if (size === "sm") {
    return (
      <Button
        variant={emphasizeConnect ? "ghost" : "outline"}
        className={cn(
          "group flex min-w-[7.5rem] items-center gap-1.5",
          emphasizeConnect ? liquidConnectClass : "border-neutral-400/75",
          outlineWarningClass
        )}
        size='sm'
        onClick={() => openWallet()}
        title={title}
        type='button'
      >
        {innerContent}
      </Button>
    )
  }

  return (
    <div className='animate'>
      <GlowingButton
        variant={emphasizeConnect ? "ghost" : "outline"}
        size='default'
        className={emphasizeConnect ? "rounded-full" : undefined}
        buttonClassName={cn(
          emphasizeConnect && liquidConnectClass,
          outlineWarningClass
        )}
        onClick={() => openWallet()}
        title={title}
      >
        {innerContent}
      </GlowingButton>
    </div>
  )
}

function NavbarLaunchAppButton({
  size,
  loopGlow = false,
}: {
  size: "default" | "sm"
  loopGlow?: boolean
}) {
  const navigate = usePreservedNavigate()

  return (
    <GlowingButton
      variant='default'
      size={size === "sm" ? "sm" : "default"}
      buttonClassName={size === "sm" ? "!px-3" : "!px-5"}
      loopGlow={loopGlow}
      onClick={() => navigate("/staking")}
    >
      <span className="font-semibold">Launch App</span>
    </GlowingButton>
  )
}

/** Desktop row: wallet / open app (inside `hidden md:flex` parent). */
export function NavbarWalletDesktop({ loopGlow = false }: { loopGlow?: boolean }) {
  const { isStakingApp } = useStakingNavFlags()
  const wallet = useStakingAppNavbarWallet()

  if (isStakingApp) {
    return (
      <NavbarWalletButtonSubtree
        {...wallet}
        size='default'
      />
    )
  }

  return <NavbarLaunchAppButton size='default' loopGlow={loopGlow} />
}

/** Mobile row (inside `flex md:hidden` parent). */
export function NavbarWalletMobile({ loopGlow = false }: { loopGlow?: boolean }) {
  const { isStakingApp } = useStakingNavFlags()
  const wallet = useStakingAppNavbarWallet()

  if (isStakingApp) {
    return (
      <NavbarWalletButtonSubtree
        {...wallet}
        size='sm'
      />
    )
  }

  return <NavbarLaunchAppButton size='sm' loopGlow={loopGlow} />
}
