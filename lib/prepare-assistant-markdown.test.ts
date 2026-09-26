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
})
