/** Upstream hosts for Next.js rewrites (safe to import from next.config). */

export const IRIS_API_ORIGIN =
  process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? "https://api.irislab.info"

/** Legacy server-side chat upstream (browser chat uses NEXT_PUBLIC_CHAT_API_ORIGIN directly). */
export const CHAT_API_ORIGIN =
  process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ?? IRIS_API_ORIGIN
