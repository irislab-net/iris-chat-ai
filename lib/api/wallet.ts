import { apiJson } from "@/lib/api/client"
import type {
  DeskLedgerEntry,
  DeskLedgerStatus,
  DeskWalletBalances,
} from "@/lib/desk-mock/types"

export type MeBalance = {
  available: string
  locked: string
  withdrawHold: string
}

export type AccountPnlBucket = {
  realized: string
  fees: string
  net: string
}

export type AccountPnl = {
  today: AccountPnlBucket
  last_30_days: AccountPnlBucket
}

export type MeLedgerRow = {
  id: string
  status: string
  route: string
  amount: string
  createdAt: string
  address?: string | null
  destinationAddress?: string | null
}

export type MeStableRoute = {
  code: string
  token: string
  network: string
  enabled: boolean
}

function parseUsd(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" ? value : null
}

export function mapMeBalance(
  balance: MeBalance,
  pnl?: AccountPnl | null
): DeskWalletBalances {
  return {
    availableUsd: parseUsd(balance.available),
    lockedUsd: parseUsd(balance.locked),
    withdrawHoldUsd: parseUsd(balance.withdrawHold),
    todayPnlUsd: parseUsd(pnl?.today.net ?? pnl?.today.realized),
    realizedPnlUsd: parseUsd(
      pnl?.last_30_days.net ?? pnl?.last_30_days.realized
    ),
  }
}

/** Client-side total — server does not return this sum. */
export function totalBalanceUsd(balance: MeBalance): number {
  return (
    parseUsd(balance.available) +
    parseUsd(balance.locked) +
    parseUsd(balance.withdrawHold)
  )
}

export function mapLedgerStatus(status: string): DeskLedgerStatus {
  switch (status.trim().toLowerCase()) {
    case "confirming":
    case "confirming_chain":
    case "processing":
      return "confirming"
    case "credited":
    case "completed":
    case "complete":
    case "success":
      return "credited"
    case "settled":
    case "approved":
    case "paid":
      return "settled"
    case "failed":
    case "rejected":
    case "error":
      return "failed"
    case "cancelled":
    case "canceled":
      return "cancelled"
    case "observed":
    case "pending":
    case "pending_review":
    case "waiting":
    default:
      return "pending"
  }
}

export function currencyFromRoute(
  route: string
): DeskLedgerEntry["currency"] {
  const lower = route.toLowerCase()
  if (lower.includes("usdc")) return "USDC"
  return "USDT"
}

export function mapMeLedgerRow(
  row: MeLedgerRow,
  kind: DeskLedgerEntry["kind"]
): DeskLedgerEntry {
  const reference =
    row.destinationAddress ?? row.address ?? undefined
  return {
    id: row.id,
    kind,
    amountUsd: parseUsd(row.amount),
    currency: currencyFromRoute(row.route),
    status: mapLedgerStatus(row.status),
    createdAt: row.createdAt,
    reference: reference || undefined,
  }
}

function parseBalance(body: unknown): MeBalance {
  if (!isRecord(body)) {
    throw Object.assign(new Error("invalid balance payload"), { status: 500 })
  }
  const available = readString(body, "available")
  const locked = readString(body, "locked")
  const withdrawHold = readString(body, "withdrawHold")
  if (available == null || locked == null || withdrawHold == null) {
    throw Object.assign(new Error("invalid balance payload"), { status: 500 })
  }
  return { available, locked, withdrawHold }
}

function parsePnlBucket(value: unknown): AccountPnlBucket {
  if (!isRecord(value)) {
    return { realized: "0", fees: "0", net: "0" }
  }
  return {
    realized: readString(value, "realized") ?? "0",
    fees: readString(value, "fees") ?? "0",
    net: readString(value, "net") ?? "0",
  }
}

function parsePnl(body: unknown): AccountPnl {
  if (!isRecord(body)) {
    return {
      today: { realized: "0", fees: "0", net: "0" },
      last_30_days: { realized: "0", fees: "0", net: "0" },
    }
  }
  return {
    today: parsePnlBucket(body.today),
    last_30_days: parsePnlBucket(body.last_30_days),
  }
}

function parseLedgerRows(
  body: unknown,
  key: "deposits" | "withdrawals"
): MeLedgerRow[] {
  if (Array.isArray(body)) {
    return body.filter(isRecord).map((row) => ({
      id: readString(row, "id") ?? "",
      status: readString(row, "status") ?? "pending",
      route: readString(row, "route") ?? "",
      amount: readString(row, "amount") ?? "0",
      createdAt: readString(row, "createdAt") ?? new Date(0).toISOString(),
      address: readString(row, "address"),
      destinationAddress: readString(row, "destinationAddress"),
    })).filter((row) => row.id)
  }
  if (!isRecord(body)) return []
  const list = body[key]
  if (!Array.isArray(list)) return []
  return parseLedgerRows(list, key)
}

export async function fetchMeBalance(): Promise<MeBalance> {
  return parseBalance(await apiJson<unknown>("/v1/me/balance"))
}

export async function fetchAccountPnl(): Promise<AccountPnl> {
  try {
    return parsePnl(await apiJson<unknown>("/v1/market/account/pnl"))
  } catch {
    // user-manager has no realized PnL; market pnl may be unavailable.
    return {
      today: { realized: "0", fees: "0", net: "0" },
      last_30_days: { realized: "0", fees: "0", net: "0" },
    }
  }
}

export async function fetchMeDeposits(): Promise<MeLedgerRow[]> {
  return parseLedgerRows(await apiJson<unknown>("/v1/me/deposits"), "deposits")
}

export async function fetchMeWithdrawals(): Promise<MeLedgerRow[]> {
  return parseLedgerRows(
    await apiJson<unknown>("/v1/me/withdrawals"),
    "withdrawals"
  )
}

export async function fetchMeStableRoutes(): Promise<MeStableRoute[]> {
  const body = await apiJson<unknown>("/v1/me/stable-routes")
  const routes = isRecord(body) && Array.isArray(body.routes) ? body.routes : []
  return routes.filter(isRecord).map((row) => ({
    code: readString(row, "code") ?? "",
    token: readString(row, "token") ?? "",
    network: readString(row, "network") ?? "",
    enabled: row.enabled !== false,
  })).filter((row) => row.code)
}

export async function fetchDeskWalletBalances(): Promise<DeskWalletBalances> {
  const [balance, pnl] = await Promise.all([
    fetchMeBalance(),
    fetchAccountPnl(),
  ])
  return mapMeBalance(balance, pnl)
}

export async function fetchDeskLedger(): Promise<{
  deposits: DeskLedgerEntry[]
  withdrawals: DeskLedgerEntry[]
}> {
  const [deposits, withdrawals] = await Promise.all([
    fetchMeDeposits(),
    fetchMeWithdrawals(),
  ])
  return {
    deposits: deposits.map((row) => mapMeLedgerRow(row, "deposit")),
    withdrawals: withdrawals.map((row) => mapMeLedgerRow(row, "withdrawal")),
  }
}

export type MeDepositInvoice = {
  id: string
  status: string
  route: string
  amount: string
  address: string
  createdAt: string
}

export type MeWithdrawalChallenge = {
  challengeId: string
  expiresAt: string
}

export type MeWithdrawal = {
  id: string
  status: string
  route: string
  amount: string
  createdAt: string
  destinationAddress?: string | null
}

function formatUsdAmount(amount: number): string {
  return amount.toFixed(6)
}

function pickDepositInvoice(body: unknown): MeDepositInvoice {
  if (!isRecord(body)) {
    throw Object.assign(new Error("invalid deposit response"), { status: 500 })
  }
  const id = readString(body, "id")
  const address = readString(body, "address")
  if (!id || !address) {
    throw Object.assign(new Error("invalid deposit response"), { status: 500 })
  }
  return {
    id,
    status: readString(body, "status") ?? "observed",
    route: readString(body, "route") ?? "",
    amount: readString(body, "amount") ?? "0",
    address,
    createdAt: readString(body, "createdAt") ?? new Date().toISOString(),
  }
}

export async function createMeDeposit(input: {
  route: string
  amountUsd: number
}): Promise<MeDepositInvoice> {
  return pickDepositInvoice(
    await apiJson<unknown>("/v1/me/deposits", {
      method: "POST",
      body: JSON.stringify({
        route: input.route,
        amount: formatUsdAmount(input.amountUsd),
      }),
    })
  )
}

export async function createWithdrawalChallenge(): Promise<MeWithdrawalChallenge> {
  const body = await apiJson<unknown>("/v1/me/withdrawal-challenges", {
    method: "POST",
  })
  if (!isRecord(body)) {
    throw Object.assign(new Error("invalid challenge response"), { status: 500 })
  }
  const challengeId = readString(body, "challengeId")
  const expiresAt = readString(body, "expiresAt")
  if (!challengeId || !expiresAt) {
    throw Object.assign(new Error("invalid challenge response"), { status: 500 })
  }
  return { challengeId, expiresAt }
}

export async function createMeWithdrawal(input: {
  route: string
  destinationAddress: string
  amountUsd: number
  code: string
  destinationExtraId?: string | null
}): Promise<MeWithdrawal> {
  const body = await apiJson<unknown>("/v1/me/withdrawals", {
    method: "POST",
    body: JSON.stringify({
      route: input.route,
      destinationAddress: input.destinationAddress,
      destinationExtraId: input.destinationExtraId ?? null,
      amount: formatUsdAmount(input.amountUsd),
      code: input.code,
    }),
  })
  if (!isRecord(body)) {
    throw Object.assign(new Error("invalid withdrawal response"), {
      status: 500,
    })
  }
  const id = readString(body, "id")
  if (!id) {
    throw Object.assign(new Error("invalid withdrawal response"), {
      status: 500,
    })
  }
  return {
    id,
    status: readString(body, "status") ?? "pending_review",
    route: readString(body, "route") ?? input.route,
    amount: readString(body, "amount") ?? formatUsdAmount(input.amountUsd),
    createdAt: readString(body, "createdAt") ?? new Date().toISOString(),
    destinationAddress:
      readString(body, "destinationAddress") ?? input.destinationAddress,
  }
}

export async function setAutoTradeEnabled(enabled: boolean): Promise<boolean> {
  const body = await apiJson<Record<string, unknown>>("/v1/me/auto-trade", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  })
  return body.auto_trade_enabled === true
}

export function preferStableRoute(
  routes: MeStableRoute[],
  token: "USDT" | "USDC",
  preferredNetwork?: string
): MeStableRoute | null {
  const enabled = routes.filter(
    (route) => route.enabled && route.token.toUpperCase() === token
  )
  if (!enabled.length) return null
  if (preferredNetwork) {
    const match = enabled.find(
      (route) => route.network.toUpperCase() === preferredNetwork.toUpperCase()
    )
    if (match) return match
  }
  const trc = enabled.find((route) => route.network.toUpperCase() === "TRC20")
  return trc ?? enabled[0] ?? null
}
