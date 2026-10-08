import { useEffect, useRef } from "react"
export type StakingFormLifecycleInput = {
  isConnected: boolean
  address: string | null | undefined
  /**
   * Tron passive staking identity (base58, case-sensitive). When provided, changes are debounced
   * like an EVM address switch. Omit on pure EVM (`undefined`).
   */
  passiveAccountKey?: string | null
  chainId: number | null
  isWrongNetwork: boolean
  amount: string
  txPhase: string
  /** When true, ignore AppKit address/chain/connect and only react to passive Tron identity. */
  isPassiveTronRuntime?: boolean

  /** Reset amount + slider; reset txPhase to idle. */
  onWalletDisconnect: () => void

  /** Network change: keep amount. */
  onNetworkChange: () => void

  /** Amount change while idle: optional extra cleanup. */
  onAmountChangeIdle: () => void

  /**
   * Debounce real disconnect vs MetaMask / in-app browser transient `isConnected` flicker.
   * @default 2800
   */
  disconnectDebounceMs?: number
  /**
   * Debounce account switch vs brief CAIP address churn during connector swap.
   * @default 600
   */
  addressChangeDebounceMs?: number
}

const DEFAULT_DISCONNECT_DEBOUNCE_MS = 2800
const DEFAULT_ADDRESS_DEBOUNCE_MS = 600

/**
 * Centralized lifecycle resets for staking forms.
 *
 *   wallet disconnect  -> reset everything (amount, slider, txPhase=idle) — debounced
 *   chainId / isWrongNetwork change -> keep amount (EVM only)
 *   amount change while idle -> onAmountChangeIdle
 */
export function useStakingFormLifecycle(input: StakingFormLifecycleInput): void {
  const {
    isConnected,
    address,
    passiveAccountKey,
    chainId,
    isWrongNetwork,
    amount,
    txPhase,
    isPassiveTronRuntime = false,
    onWalletDisconnect,
    onNetworkChange,
    onAmountChangeIdle,
    disconnectDebounceMs = DEFAULT_DISCONNECT_DEBOUNCE_MS,
    addressChangeDebounceMs = DEFAULT_ADDRESS_DEBOUNCE_MS,
  } = input

  const latest = useRef(input)
  latest.current = input

  const prevConnectedRef = useRef<boolean>(isConnected)
  const prevAddressRef = useRef<string | null>(address ?? null)
  const prevChainIdRef = useRef<number | null>(chainId)
  const prevWrongNetworkRef = useRef<boolean>(isWrongNetwork)
  const prevAmountRef = useRef<string>(amount)
  const walletEventTimerRef = useRef<number | null>(null)
  const prevPassiveAccountKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPassiveTronRuntime) {
      const fromPassive = prevPassiveAccountKeyRef.current
      const passiveTrimmed = passiveAccountKey?.trim() || null

      const passiveDisconnected =
        fromPassive !== null && passiveTrimmed === null
      const passiveSwitched =
        fromPassive !== null &&
        passiveTrimmed !== null &&
        fromPassive !== passiveTrimmed

      prevPassiveAccountKeyRef.current = passiveTrimmed

      if (!passiveDisconnected && !passiveSwitched) {
        return
      }

      if (walletEventTimerRef.current !== null) {
        window.clearTimeout(walletEventTimerRef.current)
        walletEventTimerRef.current = null
      }

      walletEventTimerRef.current = window.setTimeout(() => {
        walletEventTimerRef.current = null
        const cur = latest.current
        const curPassive = cur.passiveAccountKey?.trim() || null
        if (passiveDisconnected && curPassive !== null) return
        if (passiveSwitched && curPassive === fromPassive) return
        cur.onWalletDisconnect()
      }, addressChangeDebounceMs)

      return () => {
        if (walletEventTimerRef.current !== null) {
          window.clearTimeout(walletEventTimerRef.current)
          walletEventTimerRef.current = null
        }
      }
    }

    const fromConnected = prevConnectedRef.current
    const fromAddr = prevAddressRef.current
    const passiveTrimmed =
      passiveAccountKey === undefined
        ? null
        : passiveAccountKey?.trim() || null

    const wentDisconnected = fromConnected === true && isConnected === false
    const addressChanged =
      fromAddr !== null &&
      address !== null &&
      address !== undefined &&
      fromAddr.toLowerCase() !== address.toLowerCase()

    const passiveSwitched =
      passiveAccountKey !== undefined &&
      prevPassiveAccountKeyRef.current !== null &&
      passiveTrimmed !== null &&
      prevPassiveAccountKeyRef.current !== passiveTrimmed

    const passiveDropped =
      passiveAccountKey !== undefined &&
      prevPassiveAccountKeyRef.current !== null &&
      passiveTrimmed === null

    prevConnectedRef.current = isConnected
    prevAddressRef.current = address ?? null
    prevPassiveAccountKeyRef.current = passiveTrimmed

    if (!wentDisconnected && !addressChanged && !passiveSwitched && !passiveDropped) {
      return
    }

    if (walletEventTimerRef.current !== null) {
      window.clearTimeout(walletEventTimerRef.current)
      walletEventTimerRef.current = null
    }

    const delay = wentDisconnected ? disconnectDebounceMs : addressChangeDebounceMs
    const priorAddrLower = fromAddr?.toLowerCase() ?? null

    walletEventTimerRef.current = window.setTimeout(() => {
      walletEventTimerRef.current = null
      const cur = latest.current
      if (wentDisconnected) {
        if (cur.isConnected) return
        cur.onWalletDisconnect()
        return
      }
      const curAddr = cur.address?.toLowerCase() ?? null
      if (curAddr === priorAddrLower) return
      cur.onWalletDisconnect()
    }, delay)

    return () => {
      if (walletEventTimerRef.current !== null) {
        window.clearTimeout(walletEventTimerRef.current)
        walletEventTimerRef.current = null
      }
    }
  }, [
    isPassiveTronRuntime,
    isConnected,
    address,
    passiveAccountKey,
    disconnectDebounceMs,
    addressChangeDebounceMs,
    onWalletDisconnect,
  ])

  useEffect(() => {
    if (isPassiveTronRuntime) return

    const chainChanged =
      prevChainIdRef.current !== null &&
      chainId !== null &&
      prevChainIdRef.current !== chainId
    const wrongNetworkFlipped =
      prevWrongNetworkRef.current !== isWrongNetwork

    if (chainChanged || wrongNetworkFlipped) {
      onNetworkChange()
    }

    prevChainIdRef.current = chainId
    prevWrongNetworkRef.current = isWrongNetwork
  }, [isPassiveTronRuntime, chainId, isWrongNetwork, onNetworkChange])

  useEffect(() => {
    if (prevAmountRef.current !== amount && txPhase === "idle") {
      onAmountChangeIdle()
    }
    prevAmountRef.current = amount
  }, [amount, txPhase, onAmountChangeIdle])
}
