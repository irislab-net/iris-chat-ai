import * as React from "react"

import { cn } from "@/lib/utils"

type SfIconProps = React.SVGProps<SVGSVGElement>

/**
 * Hand-drawn SF Symbols–style menu icons (license-safe).
 * Rounded caps/joins, ~1.7 stroke on a 24 viewBox — reads as Apple UI, not Lucide.
 */
function SfIcon({ className, children, ...props }: SfIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-[1em] shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

function SfCheckIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M5.5 12.5 10 17l8.5-10" />
    </SfIcon>
  )
}

function SfChevronDownIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="m7 9.5 5 5 5-5" />
    </SfIcon>
  )
}

function SfChevronLeftIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />
    </SfIcon>
  )
}

function SfChevronRightIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />
    </SfIcon>
  )
}

function SfGearIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
      <path d="M12 3.2v1.5M12 19.3v1.5M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3.2 12h1.5M19.3 12h1.5M4.9 19.1l1.1-1.1M18 6l1.1-1.1" />
      <circle cx="12" cy="12" r="6.6" />
    </SfIcon>
  )
}

function SfPersonCircleIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.4" />
      <path d="M7.4 17.2c.9-2 2.5-3 4.6-3s3.7 1 4.6 3" />
    </SfIcon>
  )
}

/** SF-style person.2 — switch / multi-account */
function SfSwitchAccountIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="8" cy="8.2" r="2.35" />
      <path d="M3.8 16.8c.8-2.2 2.4-3.3 4.2-3.3s3.4 1.1 4.2 3.3" />
      <circle cx="16.2" cy="9" r="2.05" />
      <path d="M13.4 16.8c.6-1.7 1.8-2.6 3.2-2.6 1.4 0 2.5.9 3.1 2.3" />
    </SfIcon>
  )
}

function SfCreditCardIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2.2" />
      <path d="M3.5 10h17" />
      <path d="M7 15h3.5" />
    </SfIcon>
  )
}

function SfIphoneIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <rect x="7.5" y="2.5" width="9" height="19" rx="2.2" />
      <path d="M10.5 4.8h3" />
      <circle cx="12" cy="18.2" r="0.85" fill="currentColor" stroke="none" />
    </SfIcon>
  )
}

function SfNewspaperIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M5 6.5h11.5A2 2 0 0 1 18.5 8.5v10A1.5 1.5 0 0 1 17 20H5.5A2 2 0 0 1 3.5 18V8.5A2 2 0 0 1 5.5 6.5" />
      <path d="M8 10h6.5M8 13h6.5M8 16h4" />
      <path d="M18.5 9.5H20a.5.5 0 0 1 .5.5v8.2a1.8 1.8 0 0 1-1.8 1.8" />
    </SfIcon>
  )
}

function SfLogoutIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M14.5 12H4.5" />
      <path d="m10.5 8 4 4-4 4" />
      <path d="M14.5 5.5h2.2A2.3 2.3 0 0 1 19 7.8v8.4a2.3 2.3 0 0 1-2.3 2.3h-2.2" />
    </SfIcon>
  )
}

function SfSunIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3.2v1.8M12 19v1.8M4.9 4.9l1.3 1.3M17.8 17.8l1.3 1.3M3.2 12h1.8M19 12h1.8M4.9 19.1l1.3-1.3M17.8 6.2l1.3-1.3" />
    </SfIcon>
  )
}

function SfMoonIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M18.2 14.6A7.2 7.2 0 0 1 9.4 5.8 7.4 7.4 0 1 0 18.2 14.6Z" />
    </SfIcon>
  )
}

function SfDesktopIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
      <path d="M9 20.5h6M12 16v4.5" />
    </SfIcon>
  )
}

function SfGlobeIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5C9.6 17.9 8.4 15.1 8.4 12s1.2-5.9 3.6-8.5Z" />
    </SfIcon>
  )
}

function SfCookieIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12.2 3.6a8.4 8.4 0 1 0 8.2 9.1 3.4 3.4 0 0 1-3.5-3.4 3.4 3.4 0 0 1-4.7-5.7Z" />
      <circle cx="9" cy="10.5" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="0.7" fill="currentColor" stroke="none" />
    </SfIcon>
  )
}

function SfShieldIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12 3.5 5.5 6.2v5.1c0 4.1 2.7 7.4 6.5 8.7 3.8-1.3 6.5-4.6 6.5-8.7V6.2L12 3.5Z" />
    </SfIcon>
  )
}

function SfQuestionCircleIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.4 2.4 0 1 1 3.5 2.1c-.8.5-1.3 1-1.3 2" />
      <circle cx="12" cy="16.6" r="0.75" fill="currentColor" stroke="none" />
    </SfIcon>
  )
}

function SfBookIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M5.5 5.2A2.2 2.2 0 0 1 7.7 3.5H18v14.2H8a2.5 2.5 0 0 0-2.5 2.5V5.2Z" />
      <path d="M18 17.7H8A2.5 2.5 0 0 0 5.5 20" />
    </SfIcon>
  )
}

function SfDocTextIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M14 3.5H8.2A2.2 2.2 0 0 0 6 5.7v12.6A2.2 2.2 0 0 0 8.2 20.5h7.6a2.2 2.2 0 0 0 2.2-2.2V9Z" />
      <path d="M14 3.5V8a1.2 1.2 0 0 0 1.2 1.2H20" />
      <path d="M9 12.5h6M9 15.5h4.5" />
    </SfIcon>
  )
}

function SfMailIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2.2" />
      <path d="m4.5 8 7.5 5.5L19.5 8" />
    </SfIcon>
  )
}

function SfSparklesIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12 3.5 13.4 8.1 18 9.5l-4.6 1.4L12 15.5l-1.4-4.6L6 9.5l4.6-1.4L12 3.5Z" />
      <path d="m18.2 14.2.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
    </SfIcon>
  )
}

function SfPencilIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M14.2 5.2 18.8 9.8 9 19.6H4.4v-4.6L14.2 5.2Z" />
      <path d="m12.6 6.8 4.6 4.6" />
    </SfIcon>
  )
}

function SfPinIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12 16.5V21" />
      <path d="M8.2 3.8h7.6l-1.2 5.2c1.6.7 2.6 1.9 2.6 3.5H6.8c0-1.6 1-2.8 2.6-3.5L8.2 3.8Z" />
    </SfIcon>
  )
}

function SfPinSlashIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M12 16.5V21" />
      <path d="M8.2 3.8h7.6l-1.2 5.2c1.6.7 2.6 1.9 2.6 3.5H6.8c0-1.6 1-2.8 2.6-3.5L8.2 3.8Z" />
      <path d="m4.5 4.5 15 15" />
    </SfIcon>
  )
}

function SfTrashIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M5 7.5h14" />
      <path d="M9.5 7.5V5.8A1.3 1.3 0 0 1 10.8 4.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="m18 7.5-.9 10.2A2 2 0 0 1 15.1 19.5H8.9a2 2 0 0 1-2-1.8L6 7.5" />
    </SfIcon>
  )
}

function SfEllipsisIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="6" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </SfIcon>
  )
}

function SfSearchIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <circle cx="10.5" cy="10.5" r="5.8" />
      <path d="m15.2 15.2 4.3 4.3" />
    </SfIcon>
  )
}

function SfXMarkIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="m7 7 10 10M17 7 7 17" />
    </SfIcon>
  )
}

function SfHouseIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M4.5 11 12 4.5 19.5 11" />
      <path d="M7 10.2V18a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 18v-7.8" />
    </SfIcon>
  )
}

function SfBubbleIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <path d="M5.5 16.8A7.5 7.5 0 1 1 12 19.5H7.2L5.5 16.8Z" />
    </SfIcon>
  )
}

function SfSidebarLeftIcon({ className, ...props }: SfIconProps) {
  return (
    <SfIcon className={className} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <path d="M9 4.5v15" />
    </SfIcon>
  )
}

export {
  SfBookIcon,
  SfBubbleIcon,
  SfCheckIcon,
  SfChevronDownIcon,
  SfChevronLeftIcon,
  SfChevronRightIcon,
  SfCookieIcon,
  SfCreditCardIcon,
  SfDesktopIcon,
  SfDocTextIcon,
  SfEllipsisIcon,
  SfGearIcon,
  SfGlobeIcon,
  SfHouseIcon,
  SfIphoneIcon,
  SfLogoutIcon,
  SfMailIcon,
  SfMoonIcon,
  SfNewspaperIcon,
  SfPencilIcon,
  SfPersonCircleIcon,
  SfPinIcon,
  SfPinSlashIcon,
  SfQuestionCircleIcon,
  SfSearchIcon,
  SfShieldIcon,
  SfSidebarLeftIcon,
  SfSparklesIcon,
  SfSunIcon,
  SfSwitchAccountIcon,
  SfTrashIcon,
  SfXMarkIcon,
}
export type { SfIconProps }
