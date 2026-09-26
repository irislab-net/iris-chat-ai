import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { networkInterfaces } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const certDir = join(root, "certificates")
const keyPath = join(certDir, "localhost-key.pem")
const certPath = join(certDir, "localhost.pem")

const OPENSSL_CANDIDATES = [
  "openssl",
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
  "C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe",
]

function findOpenssl() {
  for (const candidate of OPENSSL_CANDIDATES) {
    try {
      execFileSync(candidate, ["version"], { stdio: "ignore" })
      return candidate
    } catch {
      // try next
    }
  }
  throw new Error(
    "OpenSSL not found. Install Git for Windows or OpenSSL, then re-run: pnpm certs"
  )
}

function listLanIpv4Addresses() {
  try {
    const ips = []
    for (const addrs of Object.values(networkInterfaces())) {
      for (const addr of addrs ?? []) {
        const isV4 = addr.family === "IPv4" || addr.family === 4
        if (isV4 && !addr.internal) ips.push(addr.address)
      }
    }
    return [...new Set(ips)]
  } catch {
    // Sandbox / restricted environments may block os.networkInterfaces().
    return []
  }
}

function buildSanExtension() {
  const parts = [
    "DNS:localhost",
    "DNS:local.exur.ai",
    "IP:127.0.0.1",
    "IP:::1",
    ...listLanIpv4Addresses().map((ip) => `IP:${ip}`),
  ]
  return `subjectAltName=${parts.join(",")}`
}

if (existsSync(keyPath) && existsSync(certPath)) {
  console.log("Dev certificates already exist:")
  console.log(`  ${keyPath}`)
  console.log(`  ${certPath}`)
  process.exit(0)
}

const openssl = findOpenssl()
mkdirSync(certDir, { recursive: true })

const configPath = join(certDir, "openssl.cnf")
writeFileSync(
  configPath,
  `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = local.exur.ai

[v3_req]
${buildSanExtension()}
`
)

execFileSync(
  openssl,
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-sha256",
    "-nodes",
    "-days",
    "825",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-config",
    configPath,
    "-extensions",
    "v3_req",
  ],
  { stdio: "inherit", cwd: root }
)

console.log("\nCreated dev HTTPS certificates:")
console.log(`  ${keyPath}`)
console.log(`  ${certPath}`)
console.log("\nRun: pnpm dev")
