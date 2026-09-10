import { describe, expect, it } from "vitest"

import { renderAssistantHtml } from "@/components/app-shell/ai-message-renderer"

const VALID_TABLE = `در اینجا یک جدول آورده شده است:

| زمان | قیمت | RSI |
| --- | ---: | ---: |
| 18:59 | 79725 | 47.67 |

**نکات مهم:**

- RSI در محدوده خنثی است.
`

const RAW_LLM_TABLE = `در اینجا یک جدول از آخرین تحلیل بازار بیت کوین (BTC) در بازه زمانی 1 ساعته آورده شده است: | زمان بسته شدن کندل (UTC) | قیمت بسته شدن | قیمت باز شدن |`

describe("renderAssistantHtml", () => {
  it("renders valid GFM markdown as HTML table", () => {
    const html = renderAssistantHtml(VALID_TABLE)

    expect(html).toContain("<table")
    expect(html).toContain("<strong>")
    expect(html).toContain("<ul")
  })

  it("normalizes inline pipe text into a table", () => {
    const html = renderAssistantHtml(RAW_LLM_TABLE)

    expect(html).toContain("<table")
    expect(html).toContain("زمان بسته شدن کندل")
  })
})
