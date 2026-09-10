/** Upstream hosts for Next.js rewrites (safe to import from next.config). */

export const IRIS_API_ORIGIN =
  process.env.IRIS_API_ORIGIN?.replace(/\/$/, "") ?? "https://api.irislab.info"

/** Chat API — same host as auth/me; Cloud Run preview URLs return IAM 403 without invoker access. */
export const CHAT_API_ORIGIN =
  process.env.CHAT_API_ORIGIN?.replace(/\/$/, "") ?? IRIS_API_ORIGIN
