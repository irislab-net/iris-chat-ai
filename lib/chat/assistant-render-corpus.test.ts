import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { ASSISTANT_RENDER_FIXTURES } from "@/lib/chat/assistant-render-fixtures/manifest"
import { segmentAssistantBlocks } from "@/lib/chat/assistant-blocks"
import { prepareAssistantMarkdown } from "@/lib/prepare-assistant-markdown"

const FIXTURE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "assistant-render-fixtures"
)

function readFixture(rel: string) {
  return readFileSync(join(FIXTURE_ROOT, rel), "utf8")
}

function loadBody(fixture: (typeof ASSISTANT_RENDER_FIXTURES)[number]) {
  if (fixture.path.endsWith(".json")) {
    const json = JSON.parse(readFixture(fixture.path)) as {
      content?: string
      client_actions?: Array<{ tool_name?: string; input?: string }>
      done?: {
        output_text?: string
        client_actions?: Array<{ tool_name?: string }>
      }
      event_types?: string[]
      all?: Array<{ event: string }>
    }
    if (fixture.hasSseTranscript && json.done) {
      return {
        content: json.done.output_text ?? "",
        actions: json.done.client_actions ?? [],
        events: json.event_types ?? json.all?.map((e) => e.event) ?? [],
      }
    }
    return {
      content: json.content ?? "",
      actions: json.client_actions ?? [],
      events: [] as string[],
    }
  }
  return {
    content: readFixture(fixture.path),
    actions: [] as Array<{ tool_name?: string }>,
    events: [] as string[],
  }
}

describe("assistant render corpus matrix", () => {
  it("lists every required inventory shape", () => {
    const kinds = new Set(ASSISTANT_RENDER_FIXTURES.map((f) => f.kind))
    for (const required of [
      "nested_list_ladder",
      "ascii_tree",
      "fenced_pocket_ladder",
      "gfm_table_en",
      "gfm_table_fa",
      "fa_level_board",
      "hr_mixed_en_fa",
      "blockquote_numbered_inline",
      "real_js_fence",
      "wait_prose",
      "empty_show_trade_signal",
      "empty_no_trade",
      "hybrid_prose_no_trade",
      "live_signal_no_trade_action",
      "thinking_with_tools",
      "thinking_tools_only",
    ] as const) {
      expect(kinds.has(required), `missing fixture kind ${required}`).toBe(true)
    }
  })

  for (const fixture of ASSISTANT_RENDER_FIXTURES) {
    it(`handles ${fixture.id} (${fixture.kind})`, () => {
      const { content, actions, events } = loadBody(fixture)

      if (fixture.hasClientAction) {
        const names = actions.map((a) => a.tool_name)
        expect(names).toContain(fixture.hasClientAction)
      }

      if (fixture.expectedBody === "empty") {
        expect(content.trim()).toBe("")
        return
      }

      const prepared = prepareAssistantMarkdown(content)
      expect(prepared).not.toMatch(/[├└┬┼┴]/)

      const { blocks } = segmentAssistantBlocks(content)
      expect(blocks.length).toBeGreaterThan(0)
      expect(blocks.every((b) => b.type !== "unknown")).toBe(true)

      const types = new Set(blocks.map((b) => b.type))

      switch (fixture.expectedBody) {
        case "code":
          expect(types.has("code")).toBe(true)
          expect(prepared).toContain("```js")
          break
        case "table":
          expect(
            types.has("table") ||
              blocks.some(
                (b) =>
                  b.type === "markdown" &&
                  b.text.includes("|") &&
                  b.text.includes("---")
              )
          ).toBe(true)
          break
        case "tree":
          expect(
            types.has("tree") ||
              blocks.some(
                (b) =>
                  (b.type === "markdown" || b.type === "tree") &&
                  /-\s+\*\*/.test(
                    b.type === "tree" ? b.markdown : b.text
                  )
              )
          ).toBe(true)
          break
        case "markdown":
        case "mixed":
          expect(
            types.has("markdown") ||
              types.has("tree") ||
              types.has("table") ||
              types.has("code")
          ).toBe(true)
          break
        default:
          break
      }

      if (fixture.hasSseTranscript && fixture.kind.startsWith("thinking")) {
        expect(events.length).toBeGreaterThan(0)
        expect(events.includes("done")).toBe(true)
        if (fixture.kind === "thinking_with_tools") {
          expect(events.includes("reasoning") || events.includes("tool")).toBe(
            true
          )
        }
        if (fixture.kind === "thinking_tools_only") {
          expect(events.includes("tool")).toBe(true)
        }
      }
    })
  }
})
