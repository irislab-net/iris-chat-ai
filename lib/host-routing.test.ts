import { describe, expect, it } from "vitest"

import { resolveHostRouting } from "@/lib/host-routing"

describe("resolveHostRouting", () => {
  it("skips non-split hosts (local / preview)", () => {
    expect(
      resolveHostRouting({
        hostname: "local.exur.ai",
        pathname: "/",
        search: "",
      })
    ).toEqual({ type: "next" })
    expect(
      resolveHostRouting({
        hostname: "iris-chat-ai.example.workers.dev",
        pathname: "/home",
        search: "",
      })
    ).toEqual({ type: "next" })
  })

  it("redirects www to apex", () => {
    expect(
      resolveHostRouting({
        hostname: "www.exur.ai",
        pathname: "/about",
        search: "?x=1",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/about?x=1",
      status: 308,
    })
  })

  it("serves desk at marketing root (no rewrite to landing)", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/",
        search: "",
      })
    ).toEqual({ type: "next" })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar",
        search: "",
      })
    ).toEqual({ type: "next" })
  })

  it("serves landing at /home on marketing (no redirect to /)", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/home",
        search: "",
      })
    ).toEqual({ type: "next" })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar/home",
        search: "",
      })
    ).toEqual({ type: "next" })
  })

  it("keeps desk launch queries on apex", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/",
        search: "?tab=news",
      })
    ).toEqual({ type: "next" })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar",
        search: "?q=hello",
      })
    ).toEqual({ type: "next" })
  })

  it("keeps chat-only paths on apex", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/upgrade",
        search: "",
      })
    ).toEqual({ type: "next" })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/billing",
        search: "?id=1",
      })
    ).toEqual({ type: "next" })
  })

  it("sends marketing pages from chat host to apex", () => {
    expect(
      resolveHostRouting({
        hostname: "chat.exur.ai",
        pathname: "/home",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/home",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "chat.exur.ai",
        pathname: "/ar/home",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/ar/home",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "chat.exur.ai",
        pathname: "/about",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/about",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "chat.exur.ai",
        pathname: "/features",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/features",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "chat.exur.ai",
        pathname: "/",
        search: "?tab=news",
      })
    ).toEqual({ type: "next" })
  })
})
