import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

const LOG_PATH = path.join(
  process.cwd(),
  ".cursor",
  "debug-649b23.log"
)

/** Dev-only ingest so phone WiFi clients can reach logs (127.0.0.1 is unreachable on device). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    await mkdir(path.dirname(LOG_PATH), { recursive: true })
    await appendFile(LOG_PATH, `${JSON.stringify(body)}\n`, "utf8")
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
