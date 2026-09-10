import { describe, expect, it } from "vitest"

import {
  gravatarUrlFromEmail,
  normalizeUser,
  resolveUserAvatarUrl,
} from "@/lib/user-avatar"

describe("resolveUserAvatarUrl", () => {
  it("prefers profile_image_url over x_profile_image_url", () => {
    expect(
      resolveUserAvatarUrl({
        id: "1",
        profile_image_url: "https://lh3.googleusercontent.com/a/abc",
        x_profile_image_url: "https://pbs.twimg.com/old.jpg",
      } as never)
    ).toBe("https://lh3.googleusercontent.com/a/abc")
  })

  it("falls back to Google picture field", () => {
    expect(
      resolveUserAvatarUrl({
        id: "1",
        picture: "https://lh3.googleusercontent.com/a/google",
      } as never)
    ).toBe("https://lh3.googleusercontent.com/a/google")
  })
})

describe("normalizeUser", () => {
  it("maps Google picture into profile fields", () => {
    const user = normalizeUser({
      id: "1",
      email: "user@gmail.com",
      picture: "https://lh3.googleusercontent.com/a/google",
      x_profile_image_url: "",
    })

    expect(user.profile_image_url).toBe(
      "https://lh3.googleusercontent.com/a/google"
    )
    expect(user.x_profile_image_url).toBe(
      "https://lh3.googleusercontent.com/a/google"
    )
  })
})

describe("gravatarUrlFromEmail", () => {
  it("builds a sha256 gravatar url", async () => {
    await expect(
      gravatarUrlFromEmail("myemailaddress@example.com", 96)
    ).resolves.toBe(
      "https://www.gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=96&d=404"
    )
  })
})
