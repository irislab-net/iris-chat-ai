"use client"

import { useAppViewportHeight } from "@/hooks/use-app-viewport-height"

function AppViewportSync() {
  useAppViewportHeight(true)
  return null
}

export { AppViewportSync }
