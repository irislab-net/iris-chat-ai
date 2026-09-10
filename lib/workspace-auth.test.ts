import { describe, expect, it } from "vitest"

import {
  shouldShowWorkspaceLoginGate,
  workspacePageRequiresAuth,
} from "@/lib/workspace-auth"

describe("workspace auth gates", () => {
  it("marks intel as auth-required; iris stays guest-preview friendly", () => {
    expect(workspacePageRequiresAuth("intel")).toBe(true)
    expect(workspacePageRequiresAuth("iris")).toBe(false)
    expect(workspacePageRequiresAuth("news")).toBe(false)
    expect(workspacePageRequiresAuth("desk")).toBe(false)
  })

  it("shows login gate for guests after data is ready and empty", () => {
    expect(
      shouldShowWorkspaceLoginGate("intel", {
        isAuthenticated: false,
        authLoading: false,
        dataReady: true,
        hasData: false,
      })
    ).toBe(true)
  })

  it("keeps authenticated empty states", () => {
    expect(
      shouldShowWorkspaceLoginGate("intel", {
        isAuthenticated: true,
        authLoading: false,
        dataReady: true,
        hasData: false,
      })
    ).toBe(false)
  })
})
