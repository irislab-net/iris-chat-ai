/**
 * Shared timing for soft system banners (cookie/privacy).
 *
 * Soft post-paint delay so first paint settles before consent UI.
 * CMPs commonly offer 0.5–2s; we use 1s.
 */
export const COOKIE_BANNER_REVEAL_MS = 1_000
