import { networkInterfaces, type NetworkInterfaceInfo } from "node:os"

export const LOCAL_IRIS_HOST = "local.irislab.info"
export const DEV_PORT = "3000"

export function hostnameFromHostHeader(host: string): string {
  if (host.startsWith("[")) {
    const end = host.indexOf("]")
    return end === -1 ? host : host.slice(1, end)
  }
  return host.replace(/:\d+$/, "")
}

export function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

export type DevProxyAction =
  | { type: "redirect"; hostname: string; protocol: "https:"; port: string }
  | { type: "next" }

/** Loopback stays on local.irislab.info (auth cookies). LAN keeps its Host and only upgrades HTTP. */
export function devProxyAction(input: {
  hostname: string
  isHttps: boolean
}): DevProxyAction {
  if (isLoopbackHostname(input.hostname)) {
    return {
      type: "redirect",
      hostname: LOCAL_IRIS_HOST,
      protocol: "https:",
      port: DEV_PORT,
    }
  }

  if (!input.isHttps) {
    return {
      type: "redirect",
      hostname: input.hostname,
      protocol: "https:",
      port: DEV_PORT,
    }
  }

  return { type: "next" }
}

export function listLanIpv4Addresses(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces()
): string[] {
  const ips: string[] = []
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs ?? []) {
      const isV4 = addr.family === "IPv4" || (addr.family as unknown) === 4
      if (isV4 && !addr.internal) ips.push(addr.address)
    }
  }
  return [...new Set(ips)]
}

export function allowedDevOrigins(
  interfaces?: NodeJS.Dict<NetworkInterfaceInfo[]>
): string[] {
  return [LOCAL_IRIS_HOST, "localhost", "*.local", ...listLanIpv4Addresses(interfaces)]
}
