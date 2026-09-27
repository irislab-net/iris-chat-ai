import * as React from "react"

/** Extension shim for `@/i18n/navigation` — no Next router. */
export function Link({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const absolute =
    href.startsWith("http") || href.startsWith("chrome-extension:")
      ? href
      : `https://chat.exur.ai${href.startsWith("/") ? href : `/${href}`}`
  return (
    <a href={absolute} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  )
}

export function usePathname() {
  return "/"
}

export function useRouter() {
  return {
    push: (href: string, _opts?: { scroll?: boolean }) => {
      const url = href.startsWith("http")
        ? href
        : `https://chat.exur.ai${href.startsWith("/") ? href : `/${href}`}`
      void chrome.tabs?.create?.({ url })
    },
    replace: (_href: string, _opts?: { scroll?: boolean }) => {
      /* Side panel has no URL bar — landing query cleanup is a no-op. */
    },
    back: () => undefined,
    prefetch: () => undefined,
  }
}

export function getPathname({
  href,
}: {
  locale?: string
  href: string | { pathname: string }
}) {
  if (typeof href === "string") return href
  return href.pathname
}
