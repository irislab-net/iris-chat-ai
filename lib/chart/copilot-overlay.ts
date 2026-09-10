import type { ChartOverlayLine, ChartOverlayLineKind } from "@/lib/chart/types"
import type { CopilotChartIndicatorInput } from "@/lib/paper-trading/copilot-client"

const COPILOT_COLORS: Record<CopilotChartIndicatorInput["type"], string> = {
  support: "#22c55e",
  resistance: "#ef4444",
  trendline: "#a855f7",
}

const COPILOT_LABELS: Record<CopilotChartIndicatorInput["type"], string> = {
  support: "Support",
  resistance: "Resistance",
  trendline: "Trendline",
}

function kindForIndicator(
  type: CopilotChartIndicatorInput["type"]
): ChartOverlayLineKind {
  if (type === "resistance") return "resistance"
  if (type === "trendline") return "trendline"
  return "support"
}

export function buildCopilotOverlayLine(
  input: CopilotChartIndicatorInput & { id: string }
): ChartOverlayLine {
  return {
    id: input.id,
    price: input.price,
    color: COPILOT_COLORS[input.type],
    title: `${COPILOT_LABELS[input.type]} ${input.price.toFixed(2)}`,
    lineStyle: input.type === "trendline" ? "dotted" : "solid",
    kind: kindForIndicator(input.type),
  }
}
