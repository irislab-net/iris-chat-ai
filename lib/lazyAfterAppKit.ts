import { initializeAppKit } from "@/lib/appKitBootstrap"
import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/**
 * React.lazy factory that awaits AppKit init before evaluating the route chunk.
 * Prevents `G._result.default` races when the chunk imports `@reown/appkit/react` hooks.
 */
export function lazyAfterAppKit<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    await initializeAppKit()
    const mod = await factory()
    if (mod?.default == null) {
      throw new Error("lazy_after_appkit_missing_default_export")
    }
    return mod
  })
}
