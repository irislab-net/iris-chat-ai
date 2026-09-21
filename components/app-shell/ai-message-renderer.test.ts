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
})
