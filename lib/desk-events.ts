export const DESK_WALLET_CHANGED = "exur-desk-wallet-changed"

export function notifyDeskWalletChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(DESK_WALLET_CHANGED))
}
