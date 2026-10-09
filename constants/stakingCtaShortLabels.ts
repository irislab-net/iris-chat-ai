/**
 * Ultra-short primary staking CTA labels + compact inline helpers (reason row).
 * Long copy stays in `stakingTransactionUxCopy` for modals and timelines.
 */

/** Canonical empty-amount key — used by ellipsis policy + inline reason suppression. */
export const STAKING_CTA_ENTER_AMOUNT_MESSAGE = "Enter Amount"

// —— Primary button (one glance) ——
export const STAKING_CTA_LABEL_CONNECT = "Connect"
export const STAKING_CTA_LABEL_SWITCHING = "Switching..."
export const STAKING_CTA_LABEL_WRONG_NETWORK = "Wrong Network"
export const STAKING_CTA_LABEL_LOADING = "Need to connect wallet..."
export const STAKING_CTA_LABEL_CALCULATING = "Waiting..."
export const STAKING_CTA_LABEL_PREPARING = "Preparing..."
export const STAKING_CTA_LABEL_REVIEW = "Review..."
export const STAKING_CTA_LABEL_SIGN = "Sign..."
export const STAKING_CTA_LABEL_SUBMITTED = "Submitted..."
export const STAKING_CTA_LABEL_CONFIRMING = "Confirming..."
export const STAKING_CTA_LABEL_FINALIZING = "Finalizing..."
export const STAKING_CTA_LABEL_DONE = "Done"
export const STAKING_CTA_LABEL_FAILED = "Failed"
export const STAKING_CTA_LABEL_RETRY = "Retry"
export const STAKING_CTA_LABEL_CLOSING = "Closing..."
export const STAKING_CTA_LABEL_TERMS = "Terms..."
export const STAKING_CTA_LABEL_NO_ETH = "No ETH"
export const STAKING_CTA_LABEL_ERROR = "Error"
export const STAKING_CTA_LABEL_VIEW_ONLY = "View only"

export const STAKING_CTA_LABEL_INVALID_AMOUNT = "Invalid amount!"
export const STAKING_CTA_LABEL_NO_BALANCE = "Insufficient balance!"
export const STAKING_CTA_LABEL_TOO_LOW = "Amount is too low!"

// —— Inline helper under CTA (reason.message) ——
export const STAKING_CTA_HINT_CONFIRM_WALLET = "Confirm in wallet"
export const STAKING_CTA_HINT_WRONG_NETWORK = "Switch in wallet"
export const STAKING_CTA_HINT_CONNECTING = "Need to connect wallet..."
export const STAKING_CTA_HINT_RUNTIME_SETTLING = "Almost ready..."
export const STAKING_CTA_HINT_DETACHED_TRACKING = "Finishing in background"
export const STAKING_CTA_HINT_TERMS = "Accept to continue"
export const STAKING_CTA_HINT_REVIEW = "Check summary"
export const STAKING_CTA_HINT_PREPARING_TX = "Hang tight..."
export const STAKING_CTA_HINT_APPROVE = "Approve in wallet"
export const STAKING_CTA_HINT_CONFIRM_STAKE = "Confirm staking"
export const STAKING_CTA_HINT_CONFIRM_UNSTAKE = "Confirm unstaking"
export const STAKING_CTA_HINT_FINALIZING = "Almost done..."
export const STAKING_CTA_HINT_SUBMITTED = "On-chain soon..."
export const STAKING_CTA_HINT_CONFIRMING = "Almost done..."
export const STAKING_CTA_HINT_DONE = "Close when ready"
export const STAKING_CTA_HINT_FAILED = "Retry from panel"
export const STAKING_CTA_HINT_CANCELLED = "Transaction cancelled"
export const STAKING_CTA_HINT_RPC = "Check connection"
export const STAKING_CTA_HINT_NO_ETH = "Add ETH for gas"
export const STAKING_CTA_HINT_SYNC_BALANCE = "Balancing..."
export const STAKING_CTA_HINT_VAULT = "Vault syncing..."
export const STAKING_CTA_HINT_FEES = "Updating fees..."

// —— Wallet-open nudges (submit intent, idle tx) ——
export const STAKING_CTA_WALLET_INTENT_CHECK = "Check wallet..."
export const STAKING_CTA_WALLET_INTENT_AWAITING = "Waiting..."
export const STAKING_CTA_WALLET_INTENT_STILL = "Still waiting..."

/** Shown under CTA when submit is enabled (often suppressed in deposit UI). */
export const STAKING_CTA_READY_REASON_DEPOSIT = "Ready"
export const STAKING_CTA_READY_REASON_WITHDRAW = "Ready"
