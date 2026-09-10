import { PAPER_AI_RISK_FRACTION } from "@/lib/iris-paper-trade/size"
import {
  availableBalance,
  getPaperStartingBalance,
  type PaperState,
} from "@/lib/paper-trading"

export type PaperAccountSummary = {
  startingBalance: number
  balance: number
  equity: number
  availableBalance: number
  riskPerTradeUsd: number
  riskFraction: number
}

export function summarizePaperAccount(state: PaperState): PaperAccountSummary {
  const equity = state.account.equity
  const startingBalance = getPaperStartingBalance(state)
  return {
    startingBalance,
    balance: state.account.balance,
    equity,
    availableBalance: availableBalance(state),
    riskPerTradeUsd: equity * PAPER_AI_RISK_FRACTION,
    riskFraction: PAPER_AI_RISK_FRACTION,
  }
}

export function serializePaperAccountForLlm(
  state: PaperState
): Record<string, number> {
  const summary = summarizePaperAccount(state)
  return {
    starting_balance_usdc: summary.startingBalance,
    balance_usdc: summary.balance,
    equity_usdc: summary.equity,
    available_balance_usdc: summary.availableBalance,
    risk_per_trade_usdc: summary.riskPerTradeUsd,
    risk_fraction: summary.riskFraction,
  }
}
