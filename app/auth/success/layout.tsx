import type { Metadata } from "next"

import { AUTH_SUCCESS_ROBOTS } from "@/lib/site"

export const metadata: Metadata = {
  title: "Connecting…",
  description: "Completing IRIS Lab sign-in.",
  robots: AUTH_SUCCESS_ROBOTS,
}

export default function AuthSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
