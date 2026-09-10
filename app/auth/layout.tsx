import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Signing in",
  description: "Completing your IRIS Lab sign-in with Google.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
