import { describe, expect, it } from "vitest"

import { safeAuthReturnPath } from "@/lib/api/auth"

describe("safeAuthReturnPath", () => {
  it("allows relative app paths", () => {
    expect(safeAuthReturnPath("/?tab=news", "/")).toBe("/?tab=news")
    expect(safeAuthReturnPath("/upgrade", "/")).toBe("/upgrade")
  })

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeAuthReturnPath("https://evil.example/phish", "/")).toBe("/")
    expect(safeAuthReturnPath("//evil.example/phish", "/")).toBe("/")
    expect(safeAuthReturnPath("\\\\evil.example\\phish", "/")).toBe("/")
  })

  it("falls back on empty values", () => {
    expect(safeAuthReturnPath(null, "/news")).toBe("/news")
    expect(safeAuthReturnPath("   ", "/news")).toBe("/news")
  })
})
