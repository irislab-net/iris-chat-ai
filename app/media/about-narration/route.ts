import { ABOUT_NARRATION_CDN } from "@/lib/about-narration"

/** Always hit the CDN at request time — do not ISR-cache the audio body. */
export const dynamic = "force-dynamic"

/** Same-origin stream so WebAudio can analyse the narration (CDN has no CORS). */
export async function GET(request: Request) {
  const range = request.headers.get("range")

  let upstream: Response
  try {
    upstream = await fetch(ABOUT_NARRATION_CDN, {
      headers: range ? { Range: range } : undefined,
      // Workers: plain fetch — Next data-cache + streamed bodies is unreliable here.
      cache: "no-store",
    })
  } catch {
    return new Response("Narration unavailable", { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Narration unavailable", { status: upstream.status })
  }

  const headers = new Headers()
  const pass = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ] as const
  for (const key of pass) {
    const value = upstream.headers.get(key)
    if (value) headers.set(key, value)
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", "audio/mpeg")
  }
  // Browser can cache the same-origin proxy; avoid Next/OpenNext ISR on the body.
  headers.set("cache-control", "public, max-age=86400, immutable")
  headers.set("access-control-allow-origin", "*")

  // Buffer then respond. Piping `upstream.body` through OpenNext on Workers has
  // returned opaque 500 HTML for this route in production; a buffered body is
  // small (~1MB) and keeps Range/206 headers intact for media elements.
  const body = await upstream.arrayBuffer()

  return new Response(body, {
    status: upstream.status,
    headers,
  })
}
