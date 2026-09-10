/** TradingView widget overrides — Hyperliquid-style dark terminal appearance. */
export function tradingViewDarkOverrides(isDark: boolean): Record<string, string> {
  if (!isDark) {
    return {
      "paneProperties.background": "#ffffff",
      "paneProperties.vertGridProperties.color": "rgba(0,0,0,0.04)",
      "paneProperties.horzGridProperties.color": "rgba(0,0,0,0.04)",
      "scalesProperties.textColor": "#52525b",
      "mainSeriesProperties.candleStyle.upColor": "#0ecb81",
      "mainSeriesProperties.candleStyle.downColor": "#f6465d",
      "mainSeriesProperties.candleStyle.borderUpColor": "#0ecb81",
      "mainSeriesProperties.candleStyle.borderDownColor": "#f6465d",
      "mainSeriesProperties.candleStyle.wickUpColor": "#0ecb81",
      "mainSeriesProperties.candleStyle.wickDownColor": "#f6465d",
    }
  }

  return {
    "paneProperties.background": "#0a0a0a",
    "paneProperties.backgroundType": "solid",
    "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.04)",
    "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.04)",
    "scalesProperties.textColor": "#a1a1aa",
    "scalesProperties.lineColor": "#27272a",
    "mainSeriesProperties.candleStyle.upColor": "#0ecb81",
    "mainSeriesProperties.candleStyle.downColor": "#f6465d",
    "mainSeriesProperties.candleStyle.borderUpColor": "#0ecb81",
    "mainSeriesProperties.candleStyle.borderDownColor": "#f6465d",
    "mainSeriesProperties.candleStyle.wickUpColor": "#0ecb81",
    "mainSeriesProperties.candleStyle.wickDownColor": "#f6465d",
  }
}

export const TRADINGVIEW_DISABLED_FEATURES = [
  "header_symbol_search",
  "symbol_search_hot_key",
  "display_market_status",
  "header_compare",
  "compare_symbol",
] as const

export const TRADINGVIEW_ENABLED_FEATURES = [
  "study_templates",
  "side_toolbar_in_fullscreen_mode",
  "header_in_fullscreen_mode",
  "hide_left_toolbar_by_default",
  "save_chart_properties_to_local_storage",
  "use_localstorage_for_settings",
  "items_favoriting",
  "create_volume_indicator_by_default",
] as const
