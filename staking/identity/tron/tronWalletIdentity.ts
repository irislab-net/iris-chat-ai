/**
 * Passive Tron wallet identity from injected TronLink / TronWeb only.
 * Account + network (TIP-3326 chainId) — no AppKit bridge, no signing surface.
 */
import { createTronAddressCodec } from "@/staking/core/address"
import { useCallback, useSyncExternalStore } from "react"

const tronCodec = createTronAddressCodec()

/** Same-tab cache so runtime swap to Tron does not flash empty before TronLink polls. */
let sessionPassiveTronBase58: string | null = null
/** Last known TronLink EIP-3326 chain id (hex, lowercased). */
let sessionPassiveTronChainId: string | null = null

const passiveTronIdentityListeners = new Set<() => void>()
const passiveTronNetworkListeners = new Set<() => void>()

let networkDomListenersAttached = false

/** TIP-3326 chain ids (case-sensitive per TronLink docs; stored normalized lowercase). */
export const PASSIVE_TRON_CAIP2_TO_CHAIN_ID: Readonly<Record<string, string>> = {
  "tron:nile": "0xcd8690dc",
  "tron:mainnet": "0x2b6653dc",
  "tron:shasta": "0x94a9059e",
}

const PASSIVE_TRON_MAINNET_CHAIN_ID = "0x2b6653dc"

/** Wake `useSyncExternalStore` subscribers after connect / account / network change. */
export function notifyPassiveTronWalletIdentityChanged(): void {
  passiveTronIdentityListeners.forEach(listener => listener())
  passiveTronNetworkListeners.forEach(listener => listener())
}

type TronLinkRequestHost = {
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
  chainId?: string
}

type TronDefaultAddressShape =
  | string
  | {
      base58?: unknown
      hex?: unknown
    }

type TronInjectedWindow = Window & {
  tron?: TronLinkRequestHost
  tronWeb?: TronLinkRequestHost & { defaultAddress?: TronDefaultAddressShape }
  tronLink?: TronLinkRequestHost & {
    tronWeb?: { defaultAddress?: TronDefaultAddressShape }
    ready?: boolean
  }
}

function normalizePassiveTronChainIdHex(
  raw: string | null | undefined
): string | null {
  if (raw == null || typeof raw !== "string") return null
  const t = raw.trim()
  if (!/^0x[0-9a-fA-F]+$/.test(t)) return null
  return t.toLowerCase()
}

function setPassiveTronChainId(next: string | null): void {
  const normalized = normalizePassiveTronChainIdHex(next)
  if (sessionPassiveTronChainId === normalized) return
  sessionPassiveTronChainId = normalized
  notifyPassiveTronWalletIdentityChanged()
}

function pickFirstBase58(candidates: readonly unknown[]): string | null {
  for (const raw of candidates) {
    if (typeof raw !== "string") continue
    const t = raw.trim()
    if (tronCodec.isValid(t)) return t
  }
  return null
}

function readDefaultAddressField(raw: TronDefaultAddressShape | undefined): string | null {
  if (raw == null) return null
  if (typeof raw === "string") return pickFirstBase58([raw])
  return pickFirstBase58([raw.base58, raw.hex])
}

function parseRequestAccountsResult(res: unknown): string | null {
  const fromArray = pickFirstBase58(Array.isArray(res) ? res : [])
  if (fromArray) return fromArray
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>
    if (Array.isArray(r.message)) return pickFirstBase58(r.message)
    if (typeof r.message === "string") return pickFirstBase58([r.message])
    if (typeof r.address === "string") return pickFirstBase58([r.address])
  }
  return null
}

function collectInjectedTronBase58Candidates(): string | null {
  if (typeof window === "undefined") return null
  const w = window as TronInjectedWindow
  return (
    readDefaultAddressField(w.tronWeb?.defaultAddress) ??
    readDefaultAddressField(w.tronLink?.tronWeb?.defaultAddress) ??
    null
  )
}

function readChainIdFromInjectedProvider(): string | null {
  if (typeof window === "undefined") return null
  const w = window as TronInjectedWindow
  const fromTron = normalizePassiveTronChainIdHex(w.tron?.chainId)
  if (fromTron) return fromTron
  return sessionPassiveTronChainId
}

function parseChainChangedArg(arg: unknown): string | null {
  if (arg == null) return null
  if (typeof arg === "string") return normalizePassiveTronChainIdHex(arg)
  if (typeof arg === "object") {
    const cid = (arg as Record<string, unknown>).chainId
    if (typeof cid === "string") return normalizePassiveTronChainIdHex(cid)
  }
  return null
}

function parseLegacySetNodeChainId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  const msg = d.message
  if (!msg || typeof msg !== "object") return null
  const m = msg as Record<string, unknown>
  if (m.action !== "setNode") return null
  const payload = m.data
  if (!payload || typeof payload !== "object") return null
  const node = (payload as Record<string, unknown>).node
  if (!node || typeof node !== "object") return null
  const chain = (node as Record<string, unknown>).chain
  if (chain === "_") return PASSIVE_TRON_MAINNET_CHAIN_ID
  return null
}

function isTronLinkIdentityMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  const msg = d.message
  if (!msg || typeof msg !== "object") return false
  const action = (msg as Record<string, unknown>).action
  return (
    action === "accountsChanged" ||
    action === "setAccount" ||
    action === "connect" ||
    action === "disconnect"
  )
}

function isTronLinkNetworkMessage(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  const msg = d.message
  if (!msg || typeof msg !== "object") return false
  return (msg as Record<string, unknown>).action === "setNode"
}

function syncPassiveTronNetworkFromInjection(): void {
  const cid = readChainIdFromInjectedProvider()
  if (cid) setPassiveTronChainId(cid)
}

const onChainChanged = (...args: unknown[]) => {
  const cid = parseChainChangedArg(args[0])
  if (cid) setPassiveTronChainId(cid)
}

const onAccountsChanged = () => {
  notifyPassiveTronWalletIdentityChanged()
}

function attachPassiveTronNetworkDomListeners(): void {
  if (typeof window === "undefined" || networkDomListenersAttached) return
  networkDomListenersAttached = true
  const w = window as TronInjectedWindow
  const tron = w.tron
  if (tron?.on) {
    tron.on("chainChanged", onChainChanged)
    tron.on("accountsChanged", onAccountsChanged)
  }
}

function detachPassiveTronNetworkDomListeners(): void {
  if (!networkDomListenersAttached || typeof window === "undefined") return
  networkDomListenersAttached = false
  const w = window as TronInjectedWindow
  const tron = w.tron
  if (tron?.removeListener) {
    tron.removeListener("chainChanged", onChainChanged)
    tron.removeListener("accountsChanged", onAccountsChanged)
  }
}

/**
 * Synchronous read of the active Tron account (base58 `T…`) when TronLink exposes it.
 */
export function readPassiveTronWalletBase58(): string | null {
  const live = collectInjectedTronBase58Candidates()
  if (live) {
    const prev = sessionPassiveTronBase58
    sessionPassiveTronBase58 = live
    if (prev !== live) notifyPassiveTronWalletIdentityChanged()
    return live
  }
  return sessionPassiveTronBase58
}

/** Last known TronLink network chain id (hex), or `null` if unknown. */
export function getPassiveTronWalletChainId(): string | null {
  return sessionPassiveTronChainId
}

export function passiveTronCaip2ToChainId(caip2: string): string | null {
  const key = caip2.trim().toLowerCase()
  return PASSIVE_TRON_CAIP2_TO_CHAIN_ID[key] ?? null
}

/** `true` when TronLink reports the chain id matching deployment `caip2`. */
export function passiveTronNetworkMatches(caip2: string): boolean {
  const expected = passiveTronCaip2ToChainId(caip2)
  if (!expected) return false
  const actual = getPassiveTronWalletChainId()
  if (!actual) return false
  return actual === expected.toLowerCase()
}

export function clearPassiveTronWalletSessionCache(): void {
  sessionPassiveTronBase58 = null
  sessionPassiveTronChainId = null
}

async function requestTronAccountsFromInjectedHosts(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const w = window as TronInjectedWindow
  const hosts = [w.tron, w.tronLink, w.tronWeb].filter(h => Boolean(h?.request))
  for (const host of hosts) {
    if (!host?.request) continue
    try {
      const res = await host.request({ method: "tron_requestAccounts" })
      const parsed = parseRequestAccountsResult(res)
      if (parsed) return parsed
    } catch {
      /* try next host */
    }
  }
  return null
}

/**
 * Request TronLink switch to the network for `expectedCaip2` (TIP-3326).
 * Returns `true` when the request resolves without throw (user may still reject in extension).
 */
export async function requestPassiveTronNetworkSwitch(
  expectedCaip2: string
): Promise<boolean> {
  if (typeof window === "undefined") return false
  const chainId = passiveTronCaip2ToChainId(expectedCaip2)
  if (!chainId) return false
  const w = window as TronInjectedWindow
  const hosts = [w.tron, w.tronLink, w.tronWeb].filter(h => Boolean(h?.request))
  for (const host of hosts) {
    if (!host?.request) continue
    try {
      await host.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
      setPassiveTronChainId(chainId)
      syncPassiveTronNetworkFromInjection()
      return true
    } catch {
      /* try next host */
    }
  }
  return false
}

/**
 * Prompt TronLink authorization; optionally switch to `expectedCaip2` when provided.
 */
export async function requestPassiveTronLinkConnection(
  expectedCaip2?: string
): Promise<string | null> {
  attachPassiveTronNetworkDomListeners()
  syncPassiveTronNetworkFromInjection()
  const requested = await requestTronAccountsFromInjectedHosts()
  const addr = requested ?? readPassiveTronWalletBase58()
  if (addr) {
    const prev = sessionPassiveTronBase58
    sessionPassiveTronBase58 = addr
    if (prev !== addr) notifyPassiveTronWalletIdentityChanged()
  }
  const caip2 = expectedCaip2?.trim()
  if (caip2 && addr && !passiveTronNetworkMatches(caip2)) {
    await requestPassiveTronNetworkSwitch(caip2)
  }
  syncPassiveTronNetworkFromInjection()
  return addr
}

/**
 * Subscribe to TronLink network changes (`chainChanged` + legacy `setNode`).
 */
export function subscribePassiveTronNetwork(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  passiveTronNetworkListeners.add(onStoreChange)
  attachPassiveTronNetworkDomListeners()
  syncPassiveTronNetworkFromInjection()

  const onMessage = (e: MessageEvent) => {
    const legacyCid = parseLegacySetNodeChainId(e.data)
    if (legacyCid) {
      setPassiveTronChainId(legacyCid)
      return
    }
    if (isTronLinkNetworkMessage(e.data) || isTronLinkIdentityMessage(e.data)) {
      onStoreChange()
    }
  }
  window.addEventListener("message", onMessage)

  return () => {
    passiveTronNetworkListeners.delete(onStoreChange)
    window.removeEventListener("message", onMessage)
    if (passiveTronNetworkListeners.size === 0 && passiveTronIdentityListeners.size === 0) {
      detachPassiveTronNetworkDomListeners()
    }
  }
}

function identityAndNetworkTick(onStoreChange: () => void): void {
  readPassiveTronWalletBase58()
  syncPassiveTronNetworkFromInjection()
  onStoreChange()
}

/**
 * Subscribe to Tron wallet identity changes (polling + visibility/focus + TronLink events).
 */
export function subscribePassiveTronWalletIdentity(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  passiveTronIdentityListeners.add(onStoreChange)
  attachPassiveTronNetworkDomListeners()

  const tick = () => identityAndNetworkTick(onStoreChange)
  const id = window.setInterval(tick, 1_500)
  const onVis = () => tick()
  const onFocus = () => tick()
  const onMessage = (e: MessageEvent) => {
    const legacyCid = parseLegacySetNodeChainId(e.data)
    if (legacyCid) {
      setPassiveTronChainId(legacyCid)
      return
    }
    if (isTronLinkIdentityMessage(e.data) || isTronLinkNetworkMessage(e.data)) {
      tick()
    }
  }
  document.addEventListener("visibilitychange", onVis)
  window.addEventListener("focus", onFocus)
  window.addEventListener("message", onMessage)
  tick()
  return () => {
    passiveTronIdentityListeners.delete(onStoreChange)
    window.clearInterval(id)
    document.removeEventListener("visibilitychange", onVis)
    window.removeEventListener("focus", onFocus)
    window.removeEventListener("message", onMessage)
    if (passiveTronIdentityListeners.size === 0 && passiveTronNetworkListeners.size === 0) {
      detachPassiveTronNetworkDomListeners()
    }
  }
}

/**
 * Live passive Tron address while Tron staking runtime is active; otherwise always `null`.
 */
export function usePassiveTronWalletBase58(enabled: boolean): string | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {}
      return subscribePassiveTronWalletIdentity(onChange)
    },
    [enabled]
  )
  const getSnapshot = useCallback((): string | null => {
    if (!enabled || typeof window === "undefined") return null
    return readPassiveTronWalletBase58()
  }, [enabled])
  const getServerSnapshot = useCallback((): string | null => null, [])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Live passive TronLink chain id while Tron staking runtime is active.
 */
export function usePassiveTronWalletChainId(enabled: boolean): string | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {}
      const unsubNetwork = subscribePassiveTronNetwork(onChange)
      const unsubIdentity = subscribePassiveTronWalletIdentity(onChange)
      return () => {
        unsubNetwork()
        unsubIdentity()
      }
    },
    [enabled]
  )
  const getSnapshot = useCallback((): string | null => {
    if (!enabled || typeof window === "undefined") return null
    syncPassiveTronNetworkFromInjection()
    return getPassiveTronWalletChainId()
  }, [enabled])
  const getServerSnapshot = useCallback((): string | null => null, [])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
