/**
 * Shared timing for soft system banners (cookie/privacy + PWA install).
 *
 * Sources of truth for these values:
 * - Cookie/privacy: CMPs commonly offer a 0.5–2s post-load delay so first paint
 *   settles before consent UI (web.dev: prefer overlay/footer, avoid CLS/LCP fight).
 * - PWA: Chrome’s install heuristics historically require ~30s dwell + a tap;
 *   custom nudges should never cold-prompt on first paint (web.dev / OpenPWA).
 * - Never stack: cookie/privacy wins; PWA only after consent is resolved + a gap.
 */

/** Soft post-paint delay before the cookie/privacy banner. */
export const COOKIE_BANNER_REVEAL_MS = 1_000

/**
 * After the user accepts/rejects cookies (or already had a stored choice),
 * wait this long before a PWA nudge can appear — avoids back-to-back prompts.
 */
export const PWA_AFTER_CONSENT_GAP_MS = 2_500

/**
 * Minimum session dwell before auto-arming the PWA soft nudge when the user
 * has not interacted yet. Softer than Chrome’s historic 30s, but same idea.
 */
export const PWA_ENGAGEMENT_MS = 20_000

export type BannerRevealPhase = "idle" | "waiting" | "ready"

export function shouldShowCookieBanner(
  hasStoredConsent: boolean,
  revealReady: boolean
): boolean {
  return !hasStoredConsent && revealReady
}

export function shouldShowPwaNudge({
  eligible,
  consentResolved,
  revealReady,
}: {
  eligible: boolean
  consentResolved: boolean
  revealReady: boolean
}): boolean {
  return eligible && consentResolved && revealReady
}
