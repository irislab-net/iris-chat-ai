/**
 * Cross-tree request to open the live paper-trading workspace
 * (intro CTA sits outside CandleMarketChrome).
 */
const OPEN_PAPER_TRADING_EVENT = "iris:open-paper-trading"

let pendingOpen = false

function requestOpenPaperTrading() {
  pendingOpen = true
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_PAPER_TRADING_EVENT))
  }
}

function consumePendingOpenPaperTrading(): boolean {
  if (!pendingOpen) return false
  pendingOpen = false
  return true
}

function subscribeOpenPaperTrading(handler: () => void): () => void {
  const onEvent = () => {
    pendingOpen = false
    handler()
  }
  window.addEventListener(OPEN_PAPER_TRADING_EVENT, onEvent)
  return () => window.removeEventListener(OPEN_PAPER_TRADING_EVENT, onEvent)
}

export {
  consumePendingOpenPaperTrading,
  requestOpenPaperTrading,
  subscribeOpenPaperTrading,
}
