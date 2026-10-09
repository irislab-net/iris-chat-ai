/**
 * Staking transaction + primary CTA copy.
 * ASCII ellipsis only ("...") — no Unicode "…" in user-facing transaction UX.
 */

export const STAKING_TX_UX_CONNECT_WALLET = "Connect wallet"

export const STAKING_TX_UX_SWITCHING_NETWORK = "Switching network..."
export const STAKING_TX_UX_CONFIRM_NETWORK_SWITCH_IN_WALLET =
  "Confirm network switch in wallet"
export const STAKING_TX_UX_WRONG_NETWORK = "Wrong network"

export const STAKING_TX_UX_CONNECTING_WALLET = "Connecting wallet..."

export const STAKING_TX_UX_TERMS_HINT = "Accept terms to continue..."

export const STAKING_TX_UX_REVIEW_TRANSACTION = "Review transaction..."
export const STAKING_TX_UX_REVIEW_DIALOG_HINT = "Confirm in the dialog"

export const STAKING_TX_UX_PREPARING_TRANSACTION = "Confirming..."
export const STAKING_TX_UX_PREPARING_FEE_HINT = "Estimating fee..."

export const STAKING_TX_UX_AWAITING_WALLET_SIGNATURE = "Confirm in wallet..."
export const STAKING_TX_UX_APPROVE_TOKEN_IN_WALLET = "Approve in wallet..."
export const STAKING_TX_UX_CONFIRM_STAKE_IN_WALLET = "Confirm in wallet..."
export const STAKING_TX_UX_CONFIRM_UNSTAKE_IN_WALLET = "Confirm in wallet..."

export const STAKING_TX_UX_FINALIZING_TRANSACTION = "Finalizing transaction..."
export const STAKING_TX_UX_REFRESHING_ONCHAIN_BALANCE = "Refreshing balance..."

export const STAKING_TX_UX_TRANSACTION_SUBMITTED = "Transaction submitted..."
export const STAKING_TX_UX_CONFIRMING_TRANSACTION = "Awaiting confirmation..."

export const STAKING_TX_UX_TRANSACTION_CONFIRMED = "Transaction confirmed..."
export const STAKING_TX_UX_CLOSE_DIALOG_WHEN_DONE = "Close when finished."

export const STAKING_TX_UX_TRANSACTION_FAILED = "Transaction failed..."
export const STAKING_TX_UX_RETRY_FROM_DIALOG = "Retry or dismiss from the dialog."

export const STAKING_TX_UX_CLOSING = "Closing..."
export const STAKING_TX_UX_PANEL_DISMISSED = "Transaction panel dismissed"

export const STAKING_TX_UX_LOADING_VAULT_DATA = "Loading vault data..."
export const STAKING_TX_UX_LOADING_BALANCE = "Loading balance..."

export const STAKING_TX_UX_RPC_ERROR = "Network issue. Try again."
export const STAKING_TX_UX_NOT_ENOUGH_ETH_GAS = "Low ETH for network fees"
/** Stake step failed — insufficient native balance for network fee */
export const STAKING_TX_UX_STAKE_INSUFFICIENT_GAS =
  "Not enough ETH for network fee"
/** Stake step cancelled in wallet after approval already succeeded */
export const STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET =
  "Stake cancelled in wallet"

/** Wallet-open nudges (inline CTA) */
export const STAKING_TX_UX_WALLET_INTENT_CHECK = "Check your wallet..."
export const STAKING_TX_UX_WALLET_INTENT_AWAITING = "Awaiting wallet..."
export const STAKING_TX_UX_WALLET_INTENT_STILL_WAITING =
  "Still awaiting wallet..."

/** Deposit step rail — short step labels (structure over explanation) */
export const STAKING_TX_UX_STEP_REVIEW = "Review"
export const STAKING_TX_UX_STEP_APPROVE = "Approve {token}"
export const STAKING_TX_UX_STEP_APPROVING = "Approving"
export const STAKING_TX_UX_STEP_APPROVED = "Approved"
export const STAKING_TX_UX_STEP_APPROVAL_FAILED = "Approval failed"
export const STAKING_TX_UX_STEP_STAKE = "Stake"
export const STAKING_TX_UX_STEP_STAKING = "Staking"
export const STAKING_TX_UX_STEP_STAKED = "Staked"
export const STAKING_TX_UX_STEP_STAKE_FAILED = "Stake failed"

/** Modal headers — short fintech-style state titles */
export const STAKING_TX_UX_HEADER_STAKE_PREVIEW = "Review stake"
export const STAKING_TX_UX_HEADER_WITHDRAW_PREVIEW = "Review withdraw"
export const STAKING_TX_UX_HEADER_APPROVE_IN_WALLET = "Approve in wallet"
export const STAKING_TX_UX_HEADER_STAKE_IN_WALLET = "Stake in wallet"
export const STAKING_TX_UX_HEADER_APPROVAL_FAILED = "Approval failed"
export const STAKING_TX_UX_HEADER_STAKE_FAILED = "Stake failed"
export const STAKING_TX_UX_HEADER_AWAITING_SIGNATURE = "Confirm in wallet"
export const STAKING_TX_UX_HEADER_TRANSACTION_SUBMITTED = "Transaction sent"
export const STAKING_TX_UX_HEADER_CONFIRMING_TRANSACTION = "Confirming"
export const STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED = "Transaction confirmed"
export const STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED = "Transaction cancelled"
export const STAKING_TX_UX_HEADER_TRANSACTION_FAILED = "Transaction failed"
export const STAKING_TX_UX_HEADER_TRANSACTION = "Transaction"

/** Preview + modal primary actions */
export const STAKING_TX_UX_ACTION_APPROVE_AND_STAKE = "Approve & Stake"
export const STAKING_TX_UX_ACTION_STAKE = "Stake"
export const STAKING_TX_UX_ACTION_WITHDRAW = "Withdraw"
export const STAKING_TX_UX_ACTION_OPEN_WALLET = "Open wallet"
/** @deprecated No longer surfaced in staking tx UI */
export const STAKING_TX_UX_ACTION_GO_TO_WALLET = "Go to wallet"
/** Modal alert when awaiting wallet signature */
export const STAKING_TX_UX_WALLET_MANUAL_OPEN_HINT =
  "Wallet did not open? Open your wallet manually and confirm the pending request."
/** @deprecated Use STAKING_TX_UX_WALLET_MANUAL_OPEN_HINT */
export const STAKING_TX_UX_CONFIRM_IN_TRUST_WALLET = "Confirm in Trust Wallet"
/** @deprecated Use STAKING_TX_UX_WALLET_MANUAL_OPEN_HINT */
export const STAKING_TX_UX_OPEN_TRUST_WALLET_MANUALLY =
  "Open Trust Wallet manually and confirm the pending request"
export const STAKING_TX_UX_WALLET_CONFIRMATION_CANCELLED =
  "Wallet confirmation cancelled"
export const STAKING_TX_UX_ACTION_RETRY_APPROVAL = "Retry approval"
export const STAKING_TX_UX_ACTION_RETRY_STAKE = "Retry stake"

/** Preview approval sizing — toggle labels only */
export const STAKING_TX_UX_APPROVAL_LIMITED = "Limited approval"
export const STAKING_TX_UX_APPROVAL_LIMITED_HINT = "This amount only"
export const STAKING_TX_UX_APPROVAL_UNLIMITED = "Unlimited approval"
export const STAKING_TX_UX_APPROVAL_UNLIMITED_HINT = "Skip future approvals"

/** Preview fee row when approval + stake */
export const STAKING_TX_UX_FEE_APPROVE_AND_STAKE = "Approve + Stake estimate"

/** @deprecated Use STAKING_TX_UX_HEADER_AWAITING_SIGNATURE */
export const STAKING_TX_UX_HEADER_STAKE_IN_PROGRESS =
  STAKING_TX_UX_HEADER_AWAITING_SIGNATURE
/** @deprecated Use STAKING_TX_UX_HEADER_AWAITING_SIGNATURE */
export const STAKING_TX_UX_HEADER_WITHDRAW_IN_PROGRESS =
  STAKING_TX_UX_HEADER_AWAITING_SIGNATURE
/** @deprecated Use STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED */
export const STAKING_TX_UX_HEADER_STAKE_COMPLETED =
  STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED
/** @deprecated Use STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED */
export const STAKING_TX_UX_HEADER_WITHDRAW_COMPLETED =
  STAKING_TX_UX_HEADER_TRANSACTION_CONFIRMED
/** @deprecated Use STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED */
export const STAKING_TX_UX_HEADER_STAKE_CANCELLED =
  STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED
/** @deprecated Use STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED */
export const STAKING_TX_UX_HEADER_WITHDRAW_CANCELLED =
  STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED

/** Modal footer — one short helper line below the glass card */
export const STAKING_TX_UX_FOOTER_SUBMITTED_BODY = "Safe to close"

export const STAKING_TX_UX_FOOTER_CONFIRMING_BODY = "Finishing up"

export const STAKING_TX_UX_RETRY_TRANSACTION = "Retry"

/** Terminal footnotes — complement the header (no repeated keywords) */
export const STAKING_TX_UX_FOOTNOTE_SUCCESS_CONFIRMED = "Complete"
export const STAKING_TX_UX_FOOTNOTE_DISMISSED = "Closed early"
export const STAKING_TX_UX_FOOTNOTE_WALLET_REJECT_FALLBACK = "Declined"
export const STAKING_TX_UX_FOOTNOTE_CANCELLED_RETRY = "You can retry below"
export const STAKING_TX_UX_FOOTNOTE_GENERIC_ERROR = "Please review and retry"
