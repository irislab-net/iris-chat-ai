import { describe, expect, it } from "vitest"

import {
  allowedDevOrigins,
  devProxyAction,
  hostnameFromHostHeader,
  listLanIpv4Addresses,
} from "@/lib/dev-access"

describe("hostnameFromHostHeader", () => {
  it("strips a port from ipv4 and hostnames", () => {
    expect(hostnameFromHostHeader("192.168.1.20:3000")).toBe("192.168.1.20")
    expect(hostnameFromHostHeader("local.exur.ai:3000")).toBe("local.exur.ai")
  })

  it("reads an ipv6 host", () => {
    expect(hostnameFromHostHeader("[::1]:3000")).toBe("::1")
  })
})

describe("devProxyAction", () => {
  it("sends loopback to the cookie host over https", () => {
    expect(devProxyAction({ hostname: "localhost", isHttps: false })).toEqual({
      type: "redirect",
      hostname: "local.exur.ai",
      protocol: "https:",
      port: "3000",
    })
    expect(devProxyAction({ hostname: "127.0.0.1", isHttps: true })).toEqual({
      type: "redirect",
      hostname: "local.exur.ai",
      protocol: "https:",
      port: "3000",
    })
  })

  it("upgrades a LAN http host in place instead of rewriting to local.exur.ai", () => {
    expect(
      devProxyAction({ hostname: "172.20.10.14", isHttps: false })
    ).toEqual({
      type: "redirect",
      hostname: "172.20.10.14",
      protocol: "https:",
      port: "3000",
    })
  })

  it("leaves https LAN and local.exur.ai alone", () => {
    expect(devProxyAction({ hostname: "172.20.10.14", isHttps: true })).toEqual(
      {
        type: "next",
      }
    )
    expect(
      devProxyAction({ hostname: "local.exur.ai", isHttps: true })
    ).toEqual({ type: "next" })
  })
})

describe("allowedDevOrigins", () => {
  it("includes the cookie host plus every non-internal ipv4", () => {
    expect(
      allowedDevOrigins({
        lo0: [
          {
            address: "127.0.0.1",
            netmask: "255.0.0.0",
            family: "IPv4",
            mac: "00:00:00:00:00:00",
            internal: true,
            cidr: "127.0.0.1/8",
          },
        ],
        en0: [
          {
            address: "172.20.10.14",
            netmask: "255.255.255.240",
            family: "IPv4",
            mac: "aa:bb:cc:dd:ee:ff",
            internal: false,
            cidr: "172.20.10.14/28",
          },
        ],
      })
    ).toEqual(["local.exur.ai", "localhost", "*.local", "172.20.10.14"])
  })

  it("skips loopback when listing LAN addresses", () => {
    expect(
      listLanIpv4Addresses({
        lo0: [
          {
            address: "127.0.0.1",
            netmask: "255.0.0.0",
            family: "IPv4",
            mac: "00:00:00:00:00:00",
            internal: true,
            cidr: "127.0.0.1/8",
          },
        ],
      })
    ).toEqual([])
  })
})
