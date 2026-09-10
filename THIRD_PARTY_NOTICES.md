# Third-party notices

## OpenCharts

Paper Trading chart interaction, overlays, and layout patterns are adapted from
[OpenCharts](https://github.com/dylanpersonguy/OpenCharts) (MIT License).

Copyright (c) 2024 OpenCharts Contributors

Ported / adapted files (non-exhaustive):

- `src/pages/trading/useSlTpDrag.ts` → `components/paper-trading/use-sl-tp-drag.ts`
- `src/pages/trading/ChartPanel.tsx` (overlay helpers, chart setup patterns) → `components/paper-trading/trading-chart.tsx`, `chart-overlays.ts`
- `src/pages/trading/OrderPanel.tsx` → `components/paper-trading/order-ticket.tsx`
- `src/pages/trading/BottomPanel.tsx` / `PositionsTable.tsx` → `components/paper-trading/bottom-panel.tsx`
- `src/pages/TradingPage.tsx` (layout) → `components/paper-trading/paper-trading-workspace.tsx`

## TradingView Lightweight Charts

Chart rendering uses [Lightweight Charts](https://github.com/tradingview/lightweight-charts)
by TradingView (Apache License 2.0).

Attribution is also shown in the paper-trading chart chrome.
