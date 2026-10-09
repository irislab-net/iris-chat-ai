/** Explicit opt-in for `[network]` dev console diagnostics (never hot-path console spam). */
export const DEBUG_NETWORK =
  (process.env.NODE_ENV !== 'production') &&
  String((process.env.NEXT_PUBLIC_DEBUG_NETWORK ?? process.env.VITE_DEBUG_NETWORK) ?? "")
    .trim()
    .toLowerCase() === "true"

export function isNetworkDebugLoggingEnabled(): boolean {
  return (process.env.NODE_ENV !== 'production') && DEBUG_NETWORK
}
