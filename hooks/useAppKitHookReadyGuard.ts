import { assertAppKitSingletonForHook } from "@/lib/wallet/appKitDevInvariant"

/** DEV telemetry when AppKit hooks mount before singleton commit (render-order bug). */
export function useAppKitHookReadyGuard(hookName: string): void {
  assertAppKitSingletonForHook(hookName)
}
