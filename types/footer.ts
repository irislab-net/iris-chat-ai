import type { SVGIcon } from "./icon"

export interface FooterLink {
  title: string
  link: string
}

export interface FooterLinkColumn {
  title: string
  links: FooterLink[]
}

export interface FooterSocialLink {
  title: string
  link: string
  icon: SVGIcon
}
