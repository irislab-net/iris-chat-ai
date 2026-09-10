/** Cross-tree desk symbol sync (toolbar ↔ paper trading workspace). */

const DESK_SYMBOL_REQUEST = "iris:desk-symbol"
const DESK_SYMBOL_SYNC = "iris:desk-symbol-sync"

type DeskSymbolDetail = { symbol: string }

function normalizeDeskSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function requestDeskSymbolChange(symbol: string): void {
  const key = normalizeDeskSymbol(symbol)
  if (!key || typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<DeskSymbolDetail>(DESK_SYMBOL_REQUEST, {
      detail: { symbol: key },
    })
  )
}

function broadcastDeskSymbol(symbol: string): void {
  const key = normalizeDeskSymbol(symbol)
  if (!key || typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<DeskSymbolDetail>(DESK_SYMBOL_SYNC, {
      detail: { symbol: key },
    })
  )
}

function subscribeDeskSymbolChange(handler: (symbol: string) => void): () => void {
  const onRequest = (event: Event) => {
    const symbol = (event as CustomEvent<DeskSymbolDetail>).detail?.symbol
    if (!symbol) return
    handler(normalizeDeskSymbol(symbol))
  }
  window.addEventListener(DESK_SYMBOL_REQUEST, onRequest)
  return () => window.removeEventListener(DESK_SYMBOL_REQUEST, onRequest)
}

function subscribeDeskSymbolSync(handler: (symbol: string) => void): () => void {
  const onSync = (event: Event) => {
    const symbol = (event as CustomEvent<DeskSymbolDetail>).detail?.symbol
    if (!symbol) return
    handler(normalizeDeskSymbol(symbol))
  }
  window.addEventListener(DESK_SYMBOL_SYNC, onSync)
  return () => window.removeEventListener(DESK_SYMBOL_SYNC, onSync)
}

export {
  broadcastDeskSymbol,
  requestDeskSymbolChange,
  subscribeDeskSymbolChange,
  subscribeDeskSymbolSync,
}
