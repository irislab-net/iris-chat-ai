import { networkInterfaces } from "node:os"

const ips = [
  ...new Set(
    Object.values(networkInterfaces())
      .flat()
      .filter((addr) => addr && (addr.family === "IPv4" || addr.family === 4) && !addr.internal)
      .map((addr) => addr.address)
  ),
]

console.log("\nOpen on another device on this Wi-Fi:")
if (ips.length === 0) {
  console.log("  (no LAN IPv4 found)")
} else {
  for (const ip of ips) {
    console.log(`  https://${ip}:3000`)
  }
  console.log("\nAccept the certificate warning once.")
  console.log("For login cookies, add this hosts line on that device, then use local.exur.ai:")
  for (const ip of ips) {
    console.log(`  ${ip} local.exur.ai`)
  }
  console.log("  https://local.exur.ai:3000")
}
console.log("")
