import type { NormalizedNetworkError } from "@/lib/networkErrors/types"

const metadataByError = new WeakMap<object, NormalizedNetworkError>()

/** Non-destructive classification attachment — never mutates error prototypes. */
export function attachNetworkErrorMetadata(
  error: unknown,
  normalized: NormalizedNetworkError
): void {
  if (error !== null && typeof error === "object") {
    metadataByError.set(error, normalized)
  }
}

export function readNetworkErrorMetadata(error: unknown): NormalizedNetworkError | undefined {
  if (error !== null && typeof error === "object") {
    return metadataByError.get(error)
  }
  return undefined
}
