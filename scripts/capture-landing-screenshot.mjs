import { mkdir, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { setTimeout as delay } from "node:timers/promises"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const outDir = join(root, "public", "screenshots")
const outFile = join(outDir, "landing-full.png")
const url = process.env.SCREENSHOT_URL ?? "https://localhost:3000/home"
const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const port = 9333

await mkdir(outDir, { recursive: true })

const chrome = spawn(
  chromePath,
  [
    `--remote-debugging-port=${port}`,
    "--headless=new",
    "--disable-gpu",
    "--ignore-certificate-errors",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" }
)

function cleanup() {
  try {
    chrome.kill("SIGTERM")
  } catch {
    // ignore
  }
}

process.on("exit", cleanup)
process.on("SIGINT", () => {
  cleanup()
  process.exit(1)
})

await delay(1500)

const targetRes = await fetch(
  `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
  { method: "PUT" }
)
if (!targetRes.ok) {
  cleanup()
  throw new Error(`Failed to open Chrome tab: ${targetRes.status} ${await targetRes.text()}`)
}

const target = await targetRes.json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
let id = 0
const pending = new Map()

function send(method, params = {}) {
  const messageId = ++id
  ws.send(JSON.stringify({ id: messageId, method, params }))
  return new Promise((resolve, reject) => {
    pending.set(messageId, { resolve, reject })
  })
}

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data)
  if (!data.id) return
  const entry = pending.get(data.id)
  if (!entry) return
  pending.delete(data.id)
  if (data.error) entry.reject(new Error(data.error.message))
  else entry.resolve(data.result)
})

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true })
  ws.addEventListener("error", reject, { once: true })
})

await send("Page.enable")
await send("Runtime.enable")
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
})

await send("Page.navigate", { url })

await send("Runtime.evaluate", {
  expression: `
    new Promise((resolve) => {
      if (document.readyState === "complete") resolve()
      else window.addEventListener("load", () => resolve(), { once: true })
    })
  `,
  awaitPromise: true,
})

await delay(3500)

await send("Runtime.evaluate", {
  expression: `
    (async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms))
      const pulseScroll = (top) => {
        window.scrollTo({ top, left: 0, behavior: "instant" })
        window.dispatchEvent(new Event("scroll"))
        document.dispatchEvent(new Event("scroll"))
      }
      const pageHeight = () =>
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        )
      const revealAll = () => {
        document.querySelectorAll(".invisible").forEach((el) => {
          el.classList.remove("invisible")
        })
        document.querySelectorAll("#top main *").forEach((el) => {
          if (!(el instanceof HTMLElement)) return
          const cs = getComputedStyle(el)
          if (cs.opacity === "0" || cs.visibility === "hidden") {
            el.style.setProperty("opacity", "1", "important")
            el.style.setProperty("visibility", "visible", "important")
            el.style.setProperty("transform", "none", "important")
          }
        })
      }

      pulseScroll(0)
      await wait(800)

      const step = Math.max(Math.floor(window.innerHeight * 0.35), 280)
      let y = 0
      let max = pageHeight()

      while (y < max) {
        pulseScroll(y)
        await wait(900)
        max = pageHeight()
        y += step
      }

      pulseScroll(max)
      await wait(2000)

      for (const el of document.querySelectorAll(".invisible")) {
        el.scrollIntoView({ block: "center", behavior: "instant" })
        pulseScroll(window.scrollY)
        await wait(500)
      }

      revealAll()
      await wait(1200)

      pulseScroll(0)
      await wait(1000)
      revealAll()
      await wait(500)
    })()
  `,
  awaitPromise: true,
})

await delay(1000)

const metrics = await send("Page.getLayoutMetrics")
const contentWidth = metrics.cssContentSize?.width ?? metrics.contentSize.width
const contentHeight = metrics.cssContentSize?.height ?? metrics.contentSize.height
const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: {
    x: 0,
    y: 0,
    width: contentWidth,
    height: contentHeight,
    scale: 1,
  },
})

await writeFile(outFile, Buffer.from(shot.data, "base64"))
ws.close()
cleanup()

console.log(`${outFile} (${Math.ceil(contentWidth * 2)}x${Math.ceil(contentHeight * 2)})`)
