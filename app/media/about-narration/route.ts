import { ABOUT_NARRATION_CDN } from "@/lib/about-narration"

export const runtime = "nodejs"

/** Same-origin stream so WebAudio can analyse the narration (CDN has no CORS). */
export async function GET(request: Request) {
  const range = request.headers.get("range")
  const upstream = await fetch(ABOUT_NARRATION_CDN, {
    headers: range ? { Range: range } : undefined,
    // CDN is public; cache at the edge when possible.
    next: { revalidate: 86_400 },
  })

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
    "cache-control",
  ] as const
  for (const key of pass) {
    const value = upstream.headers.get(key)
    if (value) headers.set(key, value)
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", "audio/mpeg")
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=86400, immutable")
  }
  headers.set("access-control-allow-origin", "*")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
