/** Upstream hosts for Next.js rewrites (safe to import from next.config). */

export const IRIS_API_ORIGIN =
  process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? "https://api.exur.ai"

/** Chat upstream for the /v1/chat same-origin proxy (server-side only). */
export const CHAT_API_ORIGIN =
  process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ?? IRIS_API_ORIGIN
