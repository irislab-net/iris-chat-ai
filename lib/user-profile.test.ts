import { describe, expect, it } from "vitest"

import {
  pickUserDisplayName,
  userAccountLabel,
  userAvatarFallback,
} from "@/lib/user-profile"

describe("pickUserDisplayName", () => {
  it("prefers x_name when present", () => {
    expect(
      pickUserDisplayName({
        x_name: "Mohammad Reza",
        name: "Google Name",
      })
    ).toBe("Mohammad Reza")
  })

  it("falls back to Google name fields", () => {
    expect(
      pickUserDisplayName({
        x_name: "",
        name: "Mohammad Reza",
      })
    ).toBe("Mohammad Reza")

    expect(
      pickUserDisplayName({
        given_name: "Mohammad",
        family_name: "Reza",
      })
    ).toBe("Mohammad Reza")
  })
})

describe("userAccountLabel", () => {
  it("uses display name instead of email local part", () => {
    expect(
      userAccountLabel({
        email: "mohmedi.m.reza@gmail.com",
        name: "Mohammad Reza",
      } as never)
    ).toBe("Mohammad Reza")
  })

  it("falls back to email when no name is available", () => {
    expect(
      userAccountLabel({
        email: "mohmedi.m.reza@gmail.com",
      } as never)
    ).toBe("mohmedi.m.reza@gmail.com")
  })
})

describe("userAvatarFallback", () => {
  it("uses initials from the resolved display name", () => {
    expect(
      userAvatarFallback({
        name: "Mohammad Reza",
        email: "mohmedi.m.reza@gmail.com",
      } as never)
    ).toBe("MR")
  })
})
