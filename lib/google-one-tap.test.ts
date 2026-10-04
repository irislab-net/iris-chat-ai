import { afterEach, describe, expect, it, vi } from "vitest"

import { cancelGoogleOneTap } from "@/lib/google-one-tap"

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
