import { describe, expect, it } from "vitest"

import { prepareAssistantMarkdown } from "@/lib/prepare-assistant-markdown"

describe("prepareAssistantMarkdown", () => {
  it("splits intro text from an inline header row", () => {
    const input = "در اینجا جدول است: | زمان | قیمت |\n| 12:00 | 100 |"

    expect(prepareAssistantMarkdown(input)).toBe(
      `در اینجا جدول است:

| زمان | قیمت |
| --- | --- |
| 12:00 | 100 |`
    )
  })

  it("humanizes raw epoch milliseconds echoed by the model", () => {
    const now = 1_788_835_600_000
    const publishedAt = 1_788_835_500_000
    const input = `"Avalanche Teleporter" was published at ${publishedAt} ms.`

    expect(prepareAssistantMarkdown(input, now)).toBe(
      `"Avalanche Teleporter" was published at 2m ago.`
    )
  })

  it("drops redundant relative time after epoch humanization", () => {
    const now = 1_788_835_600_000
    const publishedAt = 1_788_831_600_000
    const input = `"Headline" was published at ${publishedAt} ms, approximately 1 hour ago.`

    expect(prepareAssistantMarkdown(input, now)).toBe(
      `"Headline" was published at 1h 7m ago.`
    )
  })

  it("fixes duplicated hour phrasing in publication ranges", () => {
    const input =
      "The news items I provided were published between approximately 1 hour and 1 hour and 15 minutes ago. The published_at timestamps are in Unix milliseconds."

    expect(prepareAssistantMarkdown(input)).toBe(
      "The news items I provided were published between approximately 1 hour and 15 minutes ago."
    )
  })

  it("unwraps fenced market level boards into readable markdown", () => {
    const input = `سطوح کلیدی:

\`\`\`
[مقاومت کلیدی / سقف رِنج] 2,703.00 $ (سقف نوسان 5 و 30 دقیقه‌ای)
[مقاومت میانی] 2,693.00 - 2,696.50 $ (سطح ریجکت کندل‌های اخیر)
-------------------- قیمت لحظه‌ای: 2,690.00 $ --------------------
[حمایت فوری / دیوار سفارشات] 2,682.80 - 2,684.50 $ (کف جلسه و چگالی Bids)
\`\`\`
`

    const out = prepareAssistantMarkdown(input)
    expect(out).not.toContain("```")
    expect(out).toContain("**مقاومت کلیدی / سقف رِنج** — 2,703.00 $")
    expect(out).toContain("· _سقف نوسان 5 و 30 دقیقه‌ای_")
    expect(out).toContain("**قیمت لحظه‌ای:** 2,690.00 $")
    expect(out).toContain("---")
  })

  it("unwraps fenced ASCII pocket ladders into nested markdown lists", () => {
    const input = `Liquidity map:

\`\`\`
$83,050 ──┬── [Pocket 1: Sell-Stop Cluster & Stop-Run Void] ($82,980 – $83,050)
│  • Resting retail stops under session lows ($83,050 / $83,055 / $83,057)
│  • Thin resting bids; highly prone to slippage on liquidation spikes
$82,850 ──┼── [Pocket 2: 4H Structural Pivot Shelf] ($82,800 – $82,920)
│  • Open/close cluster of prior 4h consolidation bars ($82,922 – $82,950)
│  • First structural absorption zone for momentum sellers
$82,550 ──┴── [Pocket 4: Major HTF External Liquidity Pool] ($82,500 – $82,560)
│  • Twin 4h reaction lows: $82,551 and $82,562
\`\`\`
`

    const out = prepareAssistantMarkdown(input)
    expect(out).not.toContain("```")
    expect(out).not.toContain("──┬──")
    expect(out).toContain(
      "- **$83,050** — Pocket 1: Sell-Stop Cluster & Stop-Run Void · _$82,980 – $83,050_"
    )
    expect(out).toContain(
      "  - Resting retail stops under session lows ($83,050 / $83,055 / $83,057)"
    )
    expect(out).toContain(
      "- **$82,850** — Pocket 2: 4H Structural Pivot Shelf · _$82,800 – $82,920_"
    )
    expect(out).toContain(
      "- **$82,550** — Pocket 4: Major HTF External Liquidity Pool · _$82,500 – $82,560_"
    )
  })

  it("normalizes unfenced ASCII pocket ladders", () => {
    const input = `$82,650 ──┼── [Pocket 3: Prior Session Wick Base] ($82,640 – $82,720)
│  • Low of earlier 4h consolidation down-leg ($82,642)
│  • Primary limit buyer reload pocket`

    const out = prepareAssistantMarkdown(input)
    expect(out).not.toContain("──┼──")
    expect(out).toContain(
      "- **$82,650** — Pocket 3: Prior Session Wick Base · _$82,640 – $82,720_"
    )
    expect(out).toContain("  - Primary limit buyer reload pocket")
  })

  it("keeps real code fences intact", () => {
    const input = "Example:\n\n```js\nconst x = 1\n```\n"
    expect(prepareAssistantMarkdown(input)).toContain("```js")
    expect(prepareAssistantMarkdown(input)).toContain("const x = 1")
  })
})
