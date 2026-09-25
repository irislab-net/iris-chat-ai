import { describe, expect, it, beforeEach, afterEach } from "vitest"

import {
  readPanelLayoutForTier,
  readShellLayoutPrefs,
  writePanelLayoutForTier,
  writeShellLayoutPrefs,
} from "@/lib/shell-layout-prefs"

describe("shell-layout-prefs", () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    })
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage")
    Reflect.deleteProperty(globalThis, "window")
  })

  it("returns defaults when storage is empty", () => {
    expect(readShellLayoutPrefs()).toEqual({
      chatOpen: true,
      chatMode: "docked",
      newsOpen: false,
      panelLayouts: {},
    })
  })

  it("persists chat visibility and display mode", () => {
    writeShellLayoutPrefs({ chatOpen: false, chatMode: "focused" })
    expect(readShellLayoutPrefs()).toEqual({
      chatOpen: false,
      chatMode: "focused",
      newsOpen: false,
      panelLayouts: {},
    })
  })

  it("persists news panel open state across reads", () => {
    writeShellLayoutPrefs({ newsOpen: true })
    expect(readShellLayoutPrefs().newsOpen).toBe(true)
    writeShellLayoutPrefs({ newsOpen: false })
    expect(readShellLayoutPrefs().newsOpen).toBe(false)
  })

  it("stores panel layouts per viewport tier", () => {
    writePanelLayoutForTier("compact", { chat: 22, context: 56, ticket: 22 })
    expect(readPanelLayoutForTier("compact")).toEqual({
      chat: 22,
      context: 56,
      ticket: 22,
    })
    expect(readPanelLayoutForTier("comfortable")).toBeUndefined()
  })
})
