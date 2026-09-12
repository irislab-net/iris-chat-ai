"use client"

import * as React from "react"

import { trackContactClick } from "@/lib/analytics"

type TrackedContactLinkProps = React.ComponentPropsWithoutRef<"a"> & {
  channel: "x" | "telegram"
}

function TrackedContactLink({
  channel,
  onClick,
  ...props
}: TrackedContactLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackContactClick(channel)
        onClick?.(event)
      }}
    />
  )
}

export { TrackedContactLink }
