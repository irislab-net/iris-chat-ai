/** Deep-merge translation overlays onto the English base (objects only; arrays replace). */
export function deepMergeMessages<T extends Record<string, unknown>>(
  base: T,
  overlay: Record<string, unknown>
): T {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    const prev = out[key]
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMergeMessages(
        prev as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      out[key] = value
    }
  }
  return out as T
}
