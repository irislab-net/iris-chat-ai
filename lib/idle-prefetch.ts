/** Load a module when the browser is idle so first interaction is not a cold chunk. */
export function idlePrefetch(load: () => Promise<unknown>): () => void {
  if (typeof window === "undefined") return () => {}

  const run = () => {
    void load()
  }

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 2500 })
    return () => window.cancelIdleCallback(id)
  }

  const id = window.setTimeout(run, 1200)
  return () => window.clearTimeout(id)
}
