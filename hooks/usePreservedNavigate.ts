"use client"

import {
  buildPreservedTo,
  type PreserveLocationOptions,
} from "@/lib/routing/preserveLocationParams"
import { useRouter } from "@/i18n/navigation"
import { useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"

type NavigateOptions = {
  replace?: boolean
  scroll?: boolean
}

/**
 * Navigate helper that forwards the current location's search params and hash
 * onto a static target path by default.
 */
export function usePreservedNavigate() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (target: string, options?: NavigateOptions & PreserveLocationOptions): void => {
      const { preserveSearch, preserveHash, keys, replace, scroll } = options ?? {}
      const search = searchParams?.toString()
        ? `?${searchParams.toString()}`
        : ""
      const hash =
        typeof window !== "undefined" ? window.location.hash : ""
      const to = buildPreservedTo(
        target,
        { search, hash },
        { preserveSearch, preserveHash, keys }
      )
      if (replace) {
        router.replace(to, { scroll })
      } else {
        router.push(to, { scroll })
      }
      void pathname
    },
    [router, pathname, searchParams]
  )
}
