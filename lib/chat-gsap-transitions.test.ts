import { describe, expect, it, vi } from "vitest"

import {
  closeChatPopup,
  closeChatSidebar,
  openChatPopup,
  openChatSidebar,
  setChatSidebarProgress,
  transitionChatViews,
} from "@/lib/chat-gsap-transitions"
import { CHAT_MOTION, slideOffscreenXPercent } from "@/lib/chat-motion"

function el(): HTMLElement {
  return { style: {} } as HTMLElement
}

function createMockGsap() {
  const timeline = {
    set: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
  }
  return {
    timeline: vi.fn((opts?: { onComplete?: () => void }) => {
      if (opts?.onComplete) {
        queueMicrotask(() => opts.onComplete?.())
      }
      return timeline
    }),
    set: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    _timeline: timeline,
  }
}

describe("slideOffscreenXPercent", () => {
  it("maps start/LTR to the left", () => {
    expect(slideOffscreenXPercent("start", "ltr")).toBe(-100)
  })

  it("maps start/RTL to the right", () => {
    expect(slideOffscreenXPercent("start", "rtl")).toBe(100)
  })

  it("maps end/LTR to the right", () => {
    expect(slideOffscreenXPercent("end", "ltr")).toBe(100)
  })
})

describe("chat gsap transition builders", () => {
  it("openChatSidebar tweens scrim + panel from the same start time", () => {
    const gsap = createMockGsap()
    const sidebar = el()
    const scrim = el()

    openChatSidebar(gsap as never, {
      sidebarEl: sidebar,
      scrimEl: scrim,
      offscreenXPercent: -100,
    })

    expect(gsap.timeline).toHaveBeenCalled()
    expect(gsap._timeline.set).toHaveBeenCalled()
    expect(gsap._timeline.to).toHaveBeenCalled()
    expect(gsap._timeline.fromTo).toHaveBeenCalledWith(
      sidebar,
      expect.objectContaining({ xPercent: -100 }),
      expect.objectContaining({
        xPercent: 0,
        duration: CHAT_MOTION.panelOpen,
        ease: CHAT_MOTION.ease,
      }),
      0
    )
  })

  it("closeChatSidebar clears transforms after the timeline completes", async () => {
    const gsap = createMockGsap()
    const sidebar = el()
    const scrim = el()
    const onComplete = vi.fn()

    closeChatSidebar(gsap as never, {
      sidebarEl: sidebar,
      scrimEl: scrim,
      offscreenXPercent: -100,
      onComplete,
    })

    await vi.waitFor(() => {
      expect(gsap.set).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it("setChatSidebarProgress clamps and maps progress to xPercent", () => {
    const gsap = createMockGsap()
    const sidebar = el()
    const scrim = el()

    setChatSidebarProgress(gsap as never, {
      sidebarEl: sidebar,
      scrimEl: scrim,
      offscreenXPercent: -100,
      progress: 0.5,
    })

    expect(gsap.set).toHaveBeenCalledWith(
      sidebar,
      expect.objectContaining({ xPercent: -50 })
    )
    expect(gsap.set).toHaveBeenCalledWith(
      scrim,
      expect.objectContaining({
        opacity: CHAT_MOTION.backdropOpacity * 0.5,
      })
    )
  })

  it("openChatPopup uses back.out scale spring", () => {
    const gsap = createMockGsap()
    const popup = el()

    openChatPopup(gsap as never, { popupEl: popup })

    expect(gsap._timeline.fromTo).toHaveBeenCalledWith(
      popup,
      expect.objectContaining({
        scale: CHAT_MOTION.popupFromScale,
        opacity: 0,
      }),
      expect.objectContaining({
        scale: 1,
        ease: CHAT_MOTION.popupEase,
      })
    )
  })

  it("closeChatPopup eases out with power2.in", () => {
    const gsap = createMockGsap()
    const popup = el()

    closeChatPopup(gsap as never, { popupEl: popup })

    expect(gsap._timeline.to).toHaveBeenCalledWith(
      popup,
      expect.objectContaining({
        scale: CHAT_MOTION.popupToScale,
        ease: CHAT_MOTION.easeIn,
      })
    )
  })

  it("transitionChatViews runs a parallel full-width push", () => {
    const gsap = createMockGsap()
    const currentView = el()
    const nextView = el()

    transitionChatViews(gsap as never, { currentView, nextView })

    expect(gsap._timeline.to).toHaveBeenCalledWith(
      currentView,
      expect.objectContaining({
        xPercent: -CHAT_MOTION.viewXPercent,
        duration: CHAT_MOTION.viewDuration,
        ease: CHAT_MOTION.viewEase,
      }),
      0
    )
    expect(gsap._timeline.fromTo).toHaveBeenCalledWith(
      nextView,
      expect.objectContaining({ xPercent: 100 }),
      expect.objectContaining({
        xPercent: 0,
        duration: CHAT_MOTION.viewDuration,
        ease: CHAT_MOTION.viewEase,
      }),
      0
    )
  })
})
