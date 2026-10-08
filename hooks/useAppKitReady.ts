import { AppKitReadyContext } from "@/contexts/AppKitReadyContext"
import { useContext } from "react"

export function useAppKitReady(): boolean {
  return useContext(AppKitReadyContext)
}
