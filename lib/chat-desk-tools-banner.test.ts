import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  DESK_TOOLS_BANNER_SNOOZE_MS,
  isDeskToolsBannerSnoozed,
  readDeskToolsBannerSnoozedUntil,
  snoozeDeskToolsBanner,
} from "@/lib/chat-desk-tools-banner"

function memoryLocalStorage() {
  const map = new Map<string, string>()
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key: string, value: string) {
      map.set(key, String(value))
    },
    removeItem(key: string) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    key(i: number) {
      return [...map.keys()][i] ?? null
    },
    get length() {
      return map.size
    },
  }
}

describe("chat desk tools banner snooze", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    })
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memoryLocalStorage(),
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage")
  })

  it("is visible when nothing is stored", () => {
    expect(isDeskToolsBannerSnoozed()).toBe(false)
    expect(readDeskToolsBannerSnoozedUntil()).toBeNull()
  })

  it("snoozes for two days after dismiss", () => {
    const now = 1_700_000_000_000
    snoozeDeskToolsBanner(now)

    expect(readDeskToolsBannerSnoozedUntil()).toBe(
      now + DESK_TOOLS_BANNER_SNOOZE_MS
    )
    expect(isDeskToolsBannerSnoozed(now + 1)).toBe(true)
    expect(isDeskToolsBannerSnoozed(now + DESK_TOOLS_BANNER_SNOOZE_MS)).toBe(
      false
    )
  })
})
