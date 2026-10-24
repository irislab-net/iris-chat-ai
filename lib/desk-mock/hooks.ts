"use client"

import * as React from "react"

import {
  MOCK_LEDGER,
  MOCK_MARKETS,
  MOCK_NOWPAYMENTS_ADDRESS,
  MOCK_POSITIONS,
  MOCK_WALLET,
} from "@/lib/desk-mock/fixtures"
import type {
  DeskLedgerEntry,
  DeskMarketQuote,
  DeskMockDepositInvoice,
  DeskPosition,
  DeskWalletBalances,
} from "@/lib/desk-mock/types"

const MIDS_POLL_MS = 30_000
const DESK_SOFT_BOOT_MS = 720
const MARKETS_BOOT_MAX_MS = 1_200

type LiveMarketRow = {
  instrument: string
  hlCoin?: string
  label: string
  quote?: string
  price: number
  change24hPct: number
  volume24hUsd?: number
  high24h?: number
  low24h?: number
}

type MidsPayload = {
  prices?: Partial<Record<"BTC" | "ETH" | "XAU", number>>
  markets?: LiveMarketRow[]
}

function useDeskSoftBoot(ms = DESK_SOFT_BOOT_MS): boolean {
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), ms)
    return () => window.clearTimeout(id)
  }, [ms])

  return loading
}

function useMockWallet(): {
  balances: DeskWalletBalances
  loading: boolean
} {
  const loading = useDeskSoftBoot()
  return { balances: MOCK_WALLET, loading }
}

function useMockPositions(): {
  open: DeskPosition[]
  closed: DeskPosition[]
  loading: boolean
} {
  const loading = useDeskSoftBoot()
  const open = React.useMemo(
    () => MOCK_POSITIONS.filter((p) => p.status === "open"),
    []
  )
  const closed = React.useMemo(
    () => MOCK_POSITIONS.filter((p) => p.status === "closed"),
    []
  )
  return { open, closed, loading }
}

function useMockLedger(): {
  deposits: DeskLedgerEntry[]
  withdrawals: DeskLedgerEntry[]
  loading: boolean
} {
  const loading = useDeskSoftBoot()
  const deposits = React.useMemo(
    () => MOCK_LEDGER.filter((e) => e.kind === "deposit"),
    []
  )
  const withdrawals = React.useMemo(
    () => MOCK_LEDGER.filter((e) => e.kind === "withdrawal"),
    []
  )
  return { deposits, withdrawals, loading }
}

function useMockMarkets(): {
  markets: DeskMarketQuote[]
  loading: boolean
  demo: boolean
} {
  const [markets, setMarkets] = React.useState(MOCK_MARKETS)
  const [live, setLive] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const bootDoneRef = React.useRef(false)

  React.useEffect(() => {
    let cancelled = false

    function finishBoot() {
      if (bootDoneRef.current || cancelled) return
      bootDoneRef.current = true
      setLoading(false)
    }

    const maxWait = window.setTimeout(finishBoot, MARKETS_BOOT_MAX_MS)

    async function pull(isBoot: boolean) {
      try {
        const res = await fetch("/api/market/mids", { cache: "no-store" })
        if (!res.ok) {
          if (isBoot) finishBoot()
          return
        }
        const data = (await res.json()) as MidsPayload
        if (cancelled) return

        if (Array.isArray(data.markets) && data.markets.length > 0) {
          const now = new Date().toISOString()
          setMarkets(
            data.markets.map((row) => {
              const seed = MOCK_MARKETS.find(
                (m) => m.instrument === row.instrument
              )
              const price = row.price
              return {
                instrument: row.instrument,
                hlCoin: row.hlCoin,
                label: row.label,
                quote: row.quote ?? "USD",
                price,
                change24hPct: row.change24hPct,
                sparkline: seed?.sparkline ?? [
                  price * 0.99,
                  price * 0.995,
                  price,
                ],
                high24h: row.high24h ?? price,
                low24h: row.low24h ?? price,
                volume24hUsd: row.volume24hUsd,
                updatedAt: now,
              } satisfies DeskMarketQuote
            })
          )
          setLive(true)
          if (isBoot) finishBoot()
          return
        }

        const prices = data.prices
        if (!prices) {
          if (isBoot) finishBoot()
          return
        }
        setMarkets((prev) =>
          prev.map((m) => {
            const next = prices[m.instrument as "BTC" | "ETH" | "XAU"]
            if (typeof next !== "number" || !Number.isFinite(next)) return m
            return {
              ...m,
              price: next,
              updatedAt: new Date().toISOString(),
            }
          })
        )
        setLive(true)
        if (isBoot) finishBoot()
      } catch {
        // Keep mock fixtures.
        if (isBoot) finishBoot()
      }
    }

    void pull(true)
    const id = window.setInterval(() => void pull(false), MIDS_POLL_MS)
    return () => {
      cancelled = true
      window.clearTimeout(maxWait)
      window.clearInterval(id)
    }
  }, [])

  return { markets, loading, demo: !live }
}

type MockDepositApi = {
  invoice: DeskMockDepositInvoice | null
  startDeposit: (amountUsd: number, currency: "USDT" | "USDC") => void
  markPaid: () => void
  reset: () => void
}

function useMockDepositFlow(): MockDepositApi {
  const [invoice, setInvoice] = React.useState<DeskMockDepositInvoice | null>(
    null
  )

  const startDeposit = React.useCallback(
    (amountUsd: number, currency: "USDT" | "USDC") => {
      const now = Date.now()
      setInvoice({
        id: `inv_mock_${now}`,
        amountUsd,
        currency,
        payAddress: MOCK_NOWPAYMENTS_ADDRESS,
        status: "pending",
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 30 * 60_000).toISOString(),
      })
    },
    []
  )

  const markPaid = React.useCallback(() => {
    setInvoice((prev) =>
      prev
        ? {
            ...prev,
            status: "paid",
          }
        : prev
    )
  }, [])

  const reset = React.useCallback(() => {
    setInvoice(null)
  }, [])

  React.useEffect(() => {
    if (!invoice || invoice.status !== "pending") return
    const id = window.setTimeout(() => {
      setInvoice((prev) =>
        prev && prev.status === "pending"
          ? { ...prev, status: "confirming" }
          : prev
      )
    }, 8_000)
    return () => window.clearTimeout(id)
  }, [invoice])

  return { invoice, startDeposit, markPaid, reset }
}

type MockWithdrawApi = {
  status: "idle" | "submitting" | "submitted"
  submit: (amountUsd: number, address: string) => void
  reset: () => void
}

function useMockWithdrawFlow(): MockWithdrawApi {
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "submitted"
  >("idle")

  const submit = React.useCallback((_amountUsd: number, _address: string) => {
    setStatus("submitting")
    window.setTimeout(() => setStatus("submitted"), 900)
  }, [])

  const reset = React.useCallback(() => {
    setStatus("idle")
  }, [])

  return { status, submit, reset }
}

export {
  useMockDepositFlow,
  useMockLedger,
  useMockMarkets,
  useMockPositions,
  useMockWallet,
  useMockWithdrawFlow,
}
