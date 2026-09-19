import { gsap } from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"

let registered = false

/**
 * Register every GSAP plugin the landing page uses — once, on the client.
 *
 * Call this before any tween or ScrollTrigger. Safe to call from effects,
 * event handlers, and module scope.
 */
export function ensureGsapScroll() {
  if (typeof window === "undefined" || registered) return

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase)
  CustomEase.create("heroDemo", "0.16, 1, 0.3, 1")
  registered = true
}
