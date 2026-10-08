/**
 * Publishes active staking runtime wallet identity for UI outside `StakingVaultProvider`
 * (e.g. global navbar on `/staking/app`). Updated by `useStakingVault` only — no reconnect logic.
 */
import { isAppKitTronIdentityEnabled } from "@/staking/config"
import {
  formatStakingRuntimeWalletShort,
  type StakingRuntimeWalletIdentity,
  type StakingRuntimeWalletIdentityOrigin,
} from "@/staking/identity/stakingRuntimeWalletIdentity"
import { useCallback, useSyncExternalStore } from "react"

export type StakingRuntimeWalletIdentitySnapshot = StakingRuntimeWalletIdentity &
  Readonly<{
    shortAddress: string
    /** Active staking runtime key (navbar DEV disconnect trace). */
    runtimeKey?: string | null
  }>

const EMPTY: StakingRuntimeWalletIdentitySnapshot = {
  chainFamily: "evm",
  address: null,
  connected: false,
  hasAccount: false,
  networkOk: true,
  source: "none",
  shortAddress: "",
  runtimeKey: null,
}

let published: StakingRuntimeWalletIdentitySnapshot = EMPTY
const listeners = new Set<() => void>()

let devLastOrigin: StakingRuntimeWalletIdentityOrigin | undefined
let devLastMismatchSig: string | null = null

function identityEqual(
  a: StakingRuntimeWalletIdentitySnapshot,
  b: StakingRuntimeWalletIdentitySnapshot
): boolean {
  return (
    a.chainFamily === b.chainFamily &&
    a.address === b.address &&
    a.connected === b.connected &&
    a.hasAccount === b.hasAccount &&
    a.networkOk === b.networkOk &&
    a.source === b.source &&
    a.shortAddress === b.shortAddress &&
    a.identityOrigin === b.identityOrigin &&
    a.tronChainId === b.tronChainId &&
    a.runtimeKey === b.runtimeKey
  )
}

function traceUnifiedIdentityPublishDev(
  identity: StakingRuntimeWalletIdentity
): void {
  if (!(process.env.NODE_ENV !== 'production') || !isAppKitTronIdentityEnabled()) return
  if (identity.chainFamily !== "tron") {
    devLastOrigin = undefined
    devLastMismatchSig = null
    return
  }

  const origin = identity.identityOrigin ?? "none"
  if (devLastOrigin !== origin) {
    devLastOrigin = origin
    console.debug("[staking-runtime-identity] tron source", {
      identityOrigin: origin,
      address: identity.address,
      networkOk: identity.networkOk,
      tronChainId: identity.tronChainId ?? null,
    })
  }
}

export function publishStakingRuntimeWalletIdentity(
  identity: StakingRuntimeWalletIdentity,
  meta?: Readonly<{ runtimeKey?: string | null }>
): void {
  const next: StakingRuntimeWalletIdentitySnapshot = {
    ...identity,
    shortAddress: formatStakingRuntimeWalletShort(identity.address),
    runtimeKey: meta?.runtimeKey ?? null,
  }
  if (identityEqual(published, next)) return
  published = next
  traceUnifiedIdentityPublishDev(identity)
  listeners.forEach(l => l())
}

/** DEV-only: log when AppKit and passive addresses disagree while unified mode is on. */
export function traceUnifiedTronIdentityMismatchDev(input: Readonly<{
  appKitAddress: string | null
  passiveAddress: string | null
  publishedOrigin: StakingRuntimeWalletIdentityOrigin | undefined
}>): void {
  if (!(process.env.NODE_ENV !== 'production') || !isAppKitTronIdentityEnabled()) return
  const appKit = input.appKitAddress?.trim() ?? ""
  const passive = input.passiveAddress?.trim() ?? ""
  if (!appKit || !passive || appKit === passive) {
    devLastMismatchSig = null
    return
  }
  const sig = `${appKit}|${passive}|${input.publishedOrigin ?? ""}`
  if (devLastMismatchSig === sig) return
  devLastMismatchSig = sig
  console.debug("[staking-runtime-identity] appkit/passive mismatch", {
    appKitAddress: appKit,
    passiveAddress: passive,
    publishedOrigin: input.publishedOrigin ?? null,
  })
}

/** DEV-only: passive layer became active after AppKit was unavailable. */
export function traceUnifiedTronFallbackActivationDev(
  reason: "appkit_disconnected" | "appkit_invalid_address" | "appkit_unavailable"
): void {
  if (!(process.env.NODE_ENV !== 'production') || !isAppKitTronIdentityEnabled()) return
  console.debug("[staking-runtime-identity] passive fallback active", { reason })
}

export function clearStakingRuntimeWalletIdentityPublish(): void {
  if (identityEqual(published, EMPTY)) return
  published = EMPTY
  devLastOrigin = undefined
  devLastMismatchSig = null
  listeners.forEach(l => l())
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

function getSnapshot(): StakingRuntimeWalletIdentitySnapshot {
  return published
}

/** When `enabled` is false, returns the empty snapshot (navbar falls back to AppKit). */
export function usePublishedStakingRuntimeWalletIdentity(
  enabled: boolean
): StakingRuntimeWalletIdentitySnapshot {
  const subscribeFn = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {}
      return subscribe(onChange)
    },
    [enabled]
  )
  const getSnapshotFn = useCallback((): StakingRuntimeWalletIdentitySnapshot => {
    if (!enabled) return EMPTY
    return getSnapshot()
  }, [enabled])
  return useSyncExternalStore(subscribeFn, getSnapshotFn, () => EMPTY)
}
