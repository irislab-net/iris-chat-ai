import { describe, expect, it } from "vitest"

import {
  parseChatMessageResponse,
  parseTokenPair,
  parseUser,
} from "@/lib/api/schemas"

describe("api schemas", () => {
  it("parses token pairs", () => {
    expect(
      parseTokenPair({
        access_token: "tok",
        expires_at: "2099-01-01T00:00:00.000Z",
      })
    ).toEqual({
      access_token: "tok",
      expires_at: "2099-01-01T00:00:00.000Z",
      token_type: "Bearer",
    })
  })

  it("rejects empty access tokens", () => {
    expect(() =>
      parseTokenPair({ access_token: "", expires_at: "2099" })
    ).toThrow()
  })

  it("parses users with passthrough fields", () => {
    const user = parseUser({
      id: "u1",
      created_at: "a",
      updated_at: "b",
      x_id: "",
      x_username: "alice",
      x_name: "Alice",
      x_profile_image_url: "",
      x_verified: false,
      tier: "free",
      role: "user",
      last_login_at: "c",
      extra_field: true,
    })
    expect(user.id).toBe("u1")
    expect(user.tier).toBe("free")
  })

  it("soft-parses chat done payloads", () => {
    expect(
      parseChatMessageResponse({
        session_id: "s1",
        output_text: "Hello",
        reasoning: "Thought",
      })
    ).toMatchObject({
      session_id: "s1",
      output_text: "Hello",
      reasoning: "Thought",
    })
  })

  it("rejects non-object done payloads", () => {
    expect(parseChatMessageResponse("nope")).toBeNull()
  })
})
