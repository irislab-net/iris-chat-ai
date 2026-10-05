import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  cancelGoogleOneTap,
  clearGoogleOneTapDismissed,
  GOOGLE_ONE_TAP_DISMISSED_KEY,
  handleGoogleOneTapPromptMoment,
  isGoogleOneTapDismissed,
} from "@/lib/google-one-tap"

function dismissedNotification(
  reason: "credential_returned" | "cancel_called" | "flow_restarted"
): GooglePromptMomentNotification {
  return {
    isDismissedMoment: () => true,
    getDismissedReason: () => reason,
  }
}

function stubBrowserSession() {
  const store = new Map<string, string>()
  vi.stubGlobal("window", {})
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  })
}

describe("cancelGoogleOneTap", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("cancels GIS and removes leftover picker UI that can steal taps", () => {
    const picker = { id: "credential_picker_container", remove: vi.fn() }
    const frame = {
      src: "https://accounts.google.com/gsi/button?client_id=test",
      remove: vi.fn(),
    }

    vi.stubGlobal("document", {
      getElementById: (id: string) =>
        id === "credential_picker_container" ? picker : null,
      querySelectorAll: () => [frame],
    })

    let cancelled = false
    vi.stubGlobal("window", {
      google: {
        accounts: {
          id: {
            cancel: () => {
              cancelled = true
            },
          },
        },
      },
    })

    cancelGoogleOneTap()

    expect(cancelled).toBe(true)
    expect(picker.remove).toHaveBeenCalledOnce()
    expect(frame.remove).toHaveBeenCalledOnce()
  })
})

describe("handleGoogleOneTapPromptMoment", () => {
  beforeEach(() => {
    stubBrowserSession()
    clearGoogleOneTapDismissed()
  })

  afterEach(() => {
    clearGoogleOneTapDismissed()
    vi.unstubAllGlobals()
  })

  it("ignores non-dismissed moments (FedCM no longer exposes display/skip reasons)", () => {
    handleGoogleOneTapPromptMoment({
      isNotDisplayed: () => true,
      getNotDisplayedReason: () => "unregistered_origin",
      isSkippedMoment: () => true,
      getSkippedReason: () => "issuing_failed",
      isDismissedMoment: () => false,
    })

    expect(isGoogleOneTapDismissed()).toBe(false)
    expect(sessionStorage.getItem(GOOGLE_ONE_TAP_DISMISSED_KEY)).toBeNull()
  })

  it("does not suppress after credential handoff or programmatic cancel", () => {
    handleGoogleOneTapPromptMoment(dismissedNotification("credential_returned"))
    expect(isGoogleOneTapDismissed()).toBe(false)

    handleGoogleOneTapPromptMoment(dismissedNotification("cancel_called"))
    expect(isGoogleOneTapDismissed()).toBe(false)
  })

  it("suppresses re-prompt after an explicit user dismiss", () => {
    handleGoogleOneTapPromptMoment(dismissedNotification("flow_restarted"))
    expect(isGoogleOneTapDismissed()).toBe(true)
  })
})
