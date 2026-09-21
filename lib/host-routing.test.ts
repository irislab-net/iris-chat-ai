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

  it("rewrites marketing root to /home (and /ar to /ar/home)", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/",
        search: "",
      })
    ).toEqual({ type: "rewrite", pathname: "/home" })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar",
        search: "",
      })
    ).toEqual({ type: "rewrite", pathname: "/ar/home" })
  })

  it("canonicalizes /home on marketing to /", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/home",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar/home",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://exur.ai/ar",
      status: 308,
    })
  })

  it("sends desk launch queries from marketing to chat", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/",
        search: "?tab=news",
      })
    ).toEqual({
      type: "redirect",
      location: "https://chat.exur.ai/?tab=news",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/ar",
        search: "?q=hello",
      })
    ).toEqual({
      type: "redirect",
      location: "https://chat.exur.ai/ar?q=hello",
      status: 308,
    })
  })

  it("sends chat-only paths from marketing to chat", () => {
    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/upgrade",
        search: "",
      })
    ).toEqual({
      type: "redirect",
      location: "https://chat.exur.ai/upgrade",
      status: 308,
    })

    expect(
      resolveHostRouting({
        hostname: "exur.ai",
        pathname: "/billing",
        search: "?id=1",
      })
    ).toEqual({
      type: "redirect",
      location: "https://chat.exur.ai/billing?id=1",
      status: 308,
    })
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
      location: "https://exur.ai/",
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
        pathname: "/",
        search: "?tab=news",
      })
    ).toEqual({ type: "next" })
  })
})
