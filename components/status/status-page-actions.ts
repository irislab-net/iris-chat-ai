import { getLandingHref, getLaunchAppHref } from "@/lib/site"

export type StatusPageAction = {
  label: string
  href?: string
  onClick?: () => void
  tone?: "glass" | "light" | "primary"
}

/** Default secondary action used by locale error / 404 pages. */
export function statusLaunchAppAction(label: string): StatusPageAction {
  return {
    label,
    href: getLaunchAppHref(),
    tone: "light",
  }
}

export function statusHomeAction(label: string): StatusPageAction {
  return {
    label,
    href: getLandingHref(),
    tone: "glass",
  }
}
