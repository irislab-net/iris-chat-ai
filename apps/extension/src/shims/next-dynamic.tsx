import * as React from "react"

type DynamicOptions = {
  ssr?: boolean
  loading?: () => React.ReactNode
}

/** Shim for `next/dynamic` — eager lazy load without RSC. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function dynamic(loader: () => Promise<any>, options?: DynamicOptions): any {
  const Lazy = React.lazy(async () => {
    const mod = await loader()
    if (mod && typeof mod === "object" && "default" in mod) return mod
    return { default: mod }
  })

  function DynamicComponent(props: Record<string, unknown>) {
    return (
      <React.Suspense fallback={options?.loading?.() ?? null}>
        <Lazy {...props} />
      </React.Suspense>
    )
  }

  return DynamicComponent
}
