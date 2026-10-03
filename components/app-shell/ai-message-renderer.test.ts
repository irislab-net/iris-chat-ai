import { describe, expect, it } from "vitest"

import { renderAssistantHtml } from "@/components/app-shell/ai-message-renderer"

describe("renderAssistantHtml", () => {
  it("strips script and event-handler XSS payloads", () => {
    const html = renderAssistantHtml(
      `<img src=x onerror="alert(1)" /><script>alert(2)</script>\n\n[click](javascript:alert(3))`
    )
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/javascript:/i)
  })

  it("keeps safe https links", () => {
    const html = renderAssistantHtml("[Exur](https://exur.ai/home)")
    expect(html).toContain('href="https://exur.ai/home"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })

  it("renders ASCII pocket ladders as nested lists, not pre blocks", () => {
    const html = renderAssistantHtml(`\`\`\`
$83,050 ──┬── [Pocket 1: Sell-Stop Cluster] ($82,980 – $83,050)
│  • Resting retail stops under session lows
│  • Thin resting bids
$82,850 ──┼── [Pocket 2: 4H Pivot] ($82,800 – $82,920)
│  • First structural absorption zone
\`\`\``)
    expect(html).not.toMatch(/──┬──/)
    expect(html).toMatch(/<ul>/i)
    expect(html).toContain("<strong>$83,050</strong>")
    expect(html).toContain("Resting retail stops under session lows")
  })

  it("keeps real js fences as code", () => {
    const html = renderAssistantHtml(
      "```js\nfunction formatUsd(n) { return String(n) }\n```"
    )
    expect(html).toMatch(/<pre/i)
    expect(html).toContain("formatUsd")
  })

  it("converts unfenced file-tree ladders", () => {
    const html = renderAssistantHtml(`**$84,757** ─── **Current Spot Market**
│
├── **$84,736 – $84,749** ─── **Immediate Bid Cluster**
│   • Sits directly beneath active prints
│   • Primary passive absorption layer`)
    expect(html).not.toContain("├──")
    expect(html).toMatch(/<ul>/i)
    expect(html).toContain("Immediate Bid Cluster")
  })
})
