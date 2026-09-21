import { describe, expect, it } from "vitest"

import {
  shouldShowWorkspaceLoginGate,
  workspacePageRequiresAuth,
} from "@/lib/workspace-auth"

describe("workspace auth gates", () => {
  it("does not require auth for news or iris", () => {
    expect(workspacePageRequiresAuth("iris")).toBe(false)
    expect(workspacePageRequiresAuth("news")).toBe(false)
  })

  it("never shows login gate when auth is not required", () => {
    expect(
      shouldShowWorkspaceLoginGate("news", {
        isAuthenticated: false,
        authLoading: false,
        dataReady: true,
        hasData: false,
      })
    ).toBe(false)
  })
})
