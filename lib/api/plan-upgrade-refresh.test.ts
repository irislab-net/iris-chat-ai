import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  consumePlanUpgradePendingRefresh,
  hasPlanUpgradePendingRefresh,
  markPlanUpgradePendingRefresh,
  PLAN_UPGRADE_PENDING_REFRESH_KEY,
} from "@/lib/api/auth"

describe("plan upgrade pending refresh flag", () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    })
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => storage.clear(),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage")
    Reflect.deleteProperty(globalThis, "window")
  })

  it("marks, reports, and consumes the pending-refresh flag", () => {
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    expect(consumePlanUpgradePendingRefresh()).toBe(false)

    markPlanUpgradePendingRefresh()
    expect(sessionStorage.getItem(PLAN_UPGRADE_PENDING_REFRESH_KEY)).toBe(
      "true"
    )
    expect(hasPlanUpgradePendingRefresh()).toBe(true)
    expect(consumePlanUpgradePendingRefresh()).toBe(true)
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    expect(consumePlanUpgradePendingRefresh()).toBe(false)
  })
})
