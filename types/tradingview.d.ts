/** Minimal TradingView Charting Library type surface for IRIS integration. */
declare global {
  interface Window {
    TradingView?: {
      widget: new (options: TradingViewWidgetOptions) => TradingViewWidget
    }
  }
}

export type TradingViewWidget = {
  activeChart: () => TradingViewChart
  remove: () => void
  onChartReady: (cb: () => void) => void
  subscribe: (event: string, cb: (params: TradingViewMouseEvent) => void) => void
  unsubscribe: (event: string, cb: (params: TradingViewMouseEvent) => void) => void
  changeTheme: (theme: "light" | "dark") => void
}

export type TradingViewChart = {
  createShape: (
    point: { time?: number; price: number },
    options: Record<string, unknown>
  ) => string | null
  removeEntity: (id: string) => void
  getVisibleRange: () => { from: number; to: number } | null
  setSymbol: (symbol: string, callback?: () => void) => void
  setResolution: (resolution: string, callback?: () => void) => void
  crossHairMoved: () => {
    subscribe: (cb: (p: { price: number }) => void) => { unsubscribe: () => void }
  }
}

export type TradingViewMouseEvent = {
  clientX: number
  clientY: number
  price?: number
}

export type TradingViewWidgetOptions = {
  symbol: string
  interval: string
  container: HTMLElement
  library_path: string
  locale: string
  disabled_features?: string[]
  enabled_features?: string[]
  fullscreen?: boolean
  autosize?: boolean
  theme?: "light" | "dark"
  timezone?: string
  datafeed: unknown
  overrides?: Record<string, string>
  loading_screen?: { backgroundColor: string; foregroundColor: string }
  custom_css_url?: string
  client_id?: string
  user_id?: string
  charts_storage_url?: string
  charts_storage_api_version?: string
  load_last_chart?: boolean
  saved_data?: unknown
  auto_save_delay?: number
}

export {}
