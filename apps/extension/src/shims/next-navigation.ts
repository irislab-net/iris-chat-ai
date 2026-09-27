import * as React from "react"

export function useSearchParams() {
  return React.useMemo(() => new URLSearchParams(), [])
}

export function usePathname() {
  return "/"
}

export function useRouter() {
  return {
    push: () => undefined,
    replace: () => undefined,
    back: () => undefined,
    prefetch: () => undefined,
  }
}

export function redirect() {
  /* no-op in extension */
}

export function notFound() {
  /* no-op */
}
