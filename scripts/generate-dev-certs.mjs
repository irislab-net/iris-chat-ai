import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { networkInterfaces } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const certDir = join(root, "certificates")
const keyPath = join(certDir, "localhost-key.pem")
const certPath = join(certDir, "localhost.pem")

/** Hostnames Chrome/dev must accept (legacy IrisLab + current Exur). */
const LOCAL_HOSTNAMES = ["localhost", "local.exur.ai", "local.irislab.info"]

const OPENSSL_CANDIDATES = [
  "openssl",
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
  "C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe",
]

const force =
  process.argv.includes("--force") || process.env.FORCE_DEV_CERTS === "1"

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

function findMkcert() {
  try {
    execFileSync("mkcert", ["-help"], { stdio: "ignore" })
    return "mkcert"
  } catch {
    return null
  }
}

function listLanIpv4Addresses() {
  const ips = []
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const isV4 = addr.family === "IPv4" || addr.family === 4
      if (isV4 && !addr.internal) ips.push(addr.address)
    }
  }
  return [...new Set(ips)]
}

function certCoversRequiredHosts() {
  if (!existsSync(certPath)) return false
  try {
    const text = execFileSync(
      findOpenssl(),
      ["x509", "-in", certPath, "-noout", "-text"],
      { encoding: "utf8" }
    )
    return LOCAL_HOSTNAMES.every((host) => text.includes(`DNS:${host}`))
  } catch {
    return false
  }
}

function buildSanExtension() {
  const parts = [
    ...LOCAL_HOSTNAMES.map((h) => `DNS:${h}`),
    "IP:127.0.0.1",
    "IP:::1",
    ...listLanIpv4Addresses().map((ip) => `IP:${ip}`),
  ]
  return `subjectAltName=${parts.join(",")}`
}

function removeExisting() {
  for (const path of [keyPath, certPath, join(certDir, "openssl.cnf")]) {
    if (existsSync(path)) unlinkSync(path)
  }
}

function generateWithMkcert(mkcert) {
  mkdirSync(certDir, { recursive: true })
  // Install local CA into the system trust store (idempotent; needs sudo once).
  try {
    execFileSync(mkcert, ["-install"], { stdio: "inherit" })
  } catch {
    console.warn(
      "\nmkcert -install failed (needs your Mac password once).\n" +
        "Run:  mkcert -install\n" +
        "Then restart Chrome. Generating certs anyway…\n"
    )
  }

  const names = [
    ...LOCAL_HOSTNAMES,
    "127.0.0.1",
    "::1",
    ...listLanIpv4Addresses(),
  ]
  const outCert = join(certDir, "localhost.pem")
  const outKey = join(certDir, "localhost-key.pem")
  execFileSync(
    mkcert,
    ["-cert-file", outCert, "-key-file", outKey, ...names],
    { stdio: "inherit", cwd: root }
  )
}

function generateWithOpenssl(openssl) {
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
}

if (!force && certCoversRequiredHosts()) {
  console.log("Dev certificates already cover local hosts:")
  console.log(`  ${keyPath}`)
  console.log(`  ${certPath}`)
  process.exit(0)
}

if (existsSync(keyPath) || existsSync(certPath)) {
  console.log("Regenerating dev HTTPS certificates…")
  removeExisting()
}

const mkcert = findMkcert()
if (mkcert) {
  generateWithMkcert(mkcert)
  console.log("\nCreated trusted mkcert certificates:")
} else {
  generateWithOpenssl(findOpenssl())
  console.log("\nCreated self-signed certificates (mkcert not installed):")
  console.log("  For Chrome without warnings: brew install mkcert && pnpm certs -- --force")
}

console.log(`  ${keyPath}`)
console.log(`  ${certPath}`)
console.log("\nHosts (must resolve to 127.0.0.1):")
for (const host of LOCAL_HOSTNAMES.filter((h) => h !== "localhost")) {
  console.log(`  127.0.0.1 ${host}`)
}
console.log("\nRestart: pnpm dev")
