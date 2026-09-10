import { describe, expect, it } from "vitest"

import {
  appPathWithTab,
  resolveWorkspaceTab,
  WORKSPACE_TAB_NEWS,
  workspaceTabHref,
} from "@/lib/workspace-tab"

describe("workspace tab routing", () => {
  it("defaults bare /app to news", () => {
    expect(resolveWorkspaceTab(null)).toBe(WORKSPACE_TAB_NEWS)
    expect(resolveWorkspaceTab(undefined)).toBe(WORKSPACE_TAB_NEWS)
    expect(resolveWorkspaceTab("")).toBe(WORKSPACE_TAB_NEWS)
    expect(resolveWorkspaceTab("invalid")).toBe(WORKSPACE_TAB_NEWS)
  })

  it("keeps explicit news tab", () => {
    expect(resolveWorkspaceTab("news")).toBe(WORKSPACE_TAB_NEWS)
  })

  it("builds canonical app hrefs", () => {
    expect(workspaceTabHref(WORKSPACE_TAB_NEWS)).toBe("/app?tab=news")
    expect(appPathWithTab(WORKSPACE_TAB_NEWS)).toBe("/app?tab=news")
    expect(
      appPathWithTab(WORKSPACE_TAB_NEWS, { checkout: "success" })
    ).toBe("/app?tab=news&checkout=success")
  })
})
