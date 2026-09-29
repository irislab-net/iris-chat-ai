/**
 * PWA install is a web-app affordance. The Chrome extension already ships as an
 * installed client, so install UI stays hidden (`isEligible: false`).
 */

type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "manual"

type PwaInstallState = {
  canPrompt: boolean
  isInstalled: boolean
  needsManualInstall: boolean
  isEligible: boolean
  showNudge: boolean
  promptInstall: () => Promise<InstallOutcome>
  dismissNudge: () => void
  openManualGuide: () => void
  manualGuideOpen: boolean
  setManualGuideOpen: (open: boolean) => void
}

const unavailable = async (): Promise<InstallOutcome> => "unavailable"

function usePwaInstall(): PwaInstallState {
  return {
    canPrompt: false,
    isInstalled: true,
    needsManualInstall: false,
    isEligible: false,
    showNudge: false,
    promptInstall: unavailable,
    dismissNudge: () => {},
    openManualGuide: () => {},
    manualGuideOpen: false,
    setManualGuideOpen: () => {},
  }
}

export { usePwaInstall }
export type { InstallOutcome, PwaInstallState }
