/* eslint-disable react-refresh/only-export-components -- context module: exports hook + context object (not route components) */
import type { TransactionStatusContextValue } from "@/components/pages/staking/transactionStatusModel"
import { createContext, useContext } from "react"

export type {
  OpenPendingInput,
  RegisterReceiptCompletionInput,
  SetSuccessInput,
  SetSubmittedInput,
  TransactionStatusContextValue,
  TransactionStatusScenario,
  TransactionStatusSnapshot,
  TransactionStatusUiPhase,
  TransactionWireStepPhase,
} from "@/components/pages/staking/transactionStatusModel"
export type { StakingFeeCanonicalPair } from "@/staking/tx"

const TransactionStatusContext =
  createContext<TransactionStatusContextValue | null>(null)

export function useTransactionStatus(): TransactionStatusContextValue {
  const ctx = useContext(TransactionStatusContext)
  if (!ctx) {
    throw new Error(
      "useTransactionStatus must be used within TransactionStatusProvider"
    )
  }
  return ctx
}

export { TransactionStatusContext }
