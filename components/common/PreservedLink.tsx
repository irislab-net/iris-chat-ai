"use client"

import {
  buildPreservedTo,
  type PreserveLocationOptions,
} from "@/lib/routing/preserveLocationParams"
import { Link } from "@/i18n/navigation"
import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { useSearchParams } from "next/navigation"

export type PreservedLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href"
> &
  PreserveLocationOptions & {
    /**
     * Static destination path. Same shape callers pass to `<Link to="…">`.
     * Accepted as `to` for USDS call-site compatibility; mapped to `href`.
     */
    to: string
  }

/**
 * Drop-in replacement for USDS `<PreservedLink to>` that forwards search/hash.
 */
export const PreservedLink = forwardRef<HTMLAnchorElement, PreservedLinkProps>(
  function PreservedLink(
    { to, preserveSearch, preserveHash, keys, ...rest },
    ref
  ) {
    const searchParams = useSearchParams()
    const search = searchParams?.toString()
      ? `?${searchParams.toString()}`
      : ""
    const hash =
      typeof window !== "undefined" ? window.location.hash : ""
    const href = buildPreservedTo(
      to,
      { search, hash },
      { preserveSearch, preserveHash, keys }
    )
    return <Link ref={ref} href={href} {...rest} />
  }
)
