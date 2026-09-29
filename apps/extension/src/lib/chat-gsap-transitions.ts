/**
 * GSAP timeline builders for chat shell motion.
 * Callers must pass a loaded gsap instance from `loadChatGsap()`.
 *
 * Only animate transform (x / xPercent / scale) and opacity for compositor
 * performance. Always clear transform leftovers after close to avoid the
 * stuck `translate3d(-100%,0,0)` bug from earlier GSAP drawer attempts.
 */

import { CHAT_MOTION } from "@/lib/chat-motion"

type GsapCore = typeof import("gsap").gsap
type Timeline = gsap.core.Timeline

export type ChatSidebarTimelineOpts = {
  sidebarEl: HTMLElement
  scrimEl?: HTMLElement | null
  /** Signed offscreen xPercent (e.g. -100 from start/LTR). */
  offscreenXPercent: number
  reducedMotion?: boolean
  onComplete?: () => void
}

export type ChatPopupTimelineOpts = {
  popupEl: HTMLElement
  /** CSS transform-origin, e.g. "top left" or "top center". */
  transformOrigin?: string
  reducedMotion?: boolean
  onComplete?: () => void
}

export type ChatViewTransitionOpts = {
  currentView: HTMLElement
  nextView: HTMLElement
  /** Sign of enter direction: +1 = from end (LTR right), -1 = from start. */
  enterFromSign?: 1 | -1
  reducedMotion?: boolean
  onComplete?: () => void
}

function killInlineTransform(gsap: GsapCore, el: HTMLElement | null | undefined) {
  if (!el) return
  gsap.set(el, { clearProps: "transform,translate,x,y,xPercent,yPercent,scale,opacity" })
}

/** Open drawer: scrim fade + panel slide in (shared start time). */
export function openChatSidebar(
  gsap: GsapCore,
  opts: ChatSidebarTimelineOpts
): Timeline {
  const {
    sidebarEl,
    scrimEl,
    offscreenXPercent,
    reducedMotion = false,
    onComplete,
  } = opts

  const tl = gsap.timeline({
    onComplete,
  })

  if (reducedMotion) {
    if (scrimEl) {
      gsap.set(scrimEl, {
        display: "block",
        opacity: CHAT_MOTION.backdropOpacity,
      })
    }
    gsap.set(sidebarEl, { xPercent: 0, force3D: true })
    return tl
  }

  if (scrimEl) {
    tl.set(scrimEl, { display: "block", opacity: 0 }, 0)
    tl.to(
      scrimEl,
      {
        opacity: CHAT_MOTION.backdropOpacity,
        duration: CHAT_MOTION.backdropOpen,
        ease: CHAT_MOTION.ease,
      },
      0
    )
  }

  tl.fromTo(
    sidebarEl,
    { xPercent: offscreenXPercent, force3D: true },
    {
      xPercent: 0,
      duration: CHAT_MOTION.panelOpen,
      ease: CHAT_MOTION.ease,
      overwrite: "auto",
    },
    0
  )

  return tl
}

/** Close drawer: panel slides out + scrim fades; clears transforms when done. */
export function closeChatSidebar(
  gsap: GsapCore,
  opts: ChatSidebarTimelineOpts
): Timeline {
  const {
    sidebarEl,
    scrimEl,
    offscreenXPercent,
    reducedMotion = false,
    onComplete,
  } = opts

  const finish = () => {
    killInlineTransform(gsap, sidebarEl)
    if (scrimEl) {
      gsap.set(scrimEl, { display: "none", opacity: 0 })
      killInlineTransform(gsap, scrimEl)
    }
    onComplete?.()
  }

  const tl = gsap.timeline({ onComplete: finish })

  if (reducedMotion) {
    gsap.set(sidebarEl, { xPercent: offscreenXPercent, force3D: true })
    if (scrimEl) gsap.set(scrimEl, { opacity: 0 })
    // still run finish via timeline complete on next tick
    tl.set({}, {}, 0)
    return tl
  }

  tl.to(
    sidebarEl,
    {
      xPercent: offscreenXPercent,
      duration: CHAT_MOTION.panelClose,
      ease: CHAT_MOTION.easeIn,
      overwrite: "auto",
    },
    0
  )

  if (scrimEl) {
    tl.to(
      scrimEl,
      {
        opacity: 0,
        duration: CHAT_MOTION.backdropClose,
        ease: CHAT_MOTION.easeIn,
      },
      0
    )
  }

  return tl
}

/** Scrub drawer progress 0 (closed) → 1 (open) while dragging. */
export function setChatSidebarProgress(
  gsap: GsapCore,
  opts: {
    sidebarEl: HTMLElement
    scrimEl?: HTMLElement | null
    offscreenXPercent: number
    progress: number
  }
) {
  const p = Math.min(1, Math.max(0, opts.progress))
  const xPercent = opts.offscreenXPercent * (1 - p)
  gsap.set(opts.sidebarEl, { xPercent, force3D: true })
  if (opts.scrimEl) {
    gsap.set(opts.scrimEl, {
      display: "block",
      opacity: CHAT_MOTION.backdropOpacity * p,
    })
  }
}

/** Scale + fade popup open (model pickers, glass menus). */
export function openChatPopup(
  gsap: GsapCore,
  opts: ChatPopupTimelineOpts
): Timeline {
  const {
    popupEl,
    transformOrigin = "top left",
    reducedMotion = false,
    onComplete,
  } = opts

  const tl = gsap.timeline({ onComplete })

  if (reducedMotion) {
    gsap.set(popupEl, {
      scale: 1,
      opacity: 1,
      transformOrigin,
      force3D: true,
    })
    return tl
  }

  tl.fromTo(
    popupEl,
    {
      scale: CHAT_MOTION.popupFromScale,
      opacity: 0,
      transformOrigin,
      force3D: true,
    },
    {
      scale: 1,
      opacity: 1,
      duration: CHAT_MOTION.popupOpen,
      ease: CHAT_MOTION.popupEase,
      overwrite: "auto",
    }
  )

  return tl
}

/** Scale + fade popup closed; clears transform leftovers. */
export function closeChatPopup(
  gsap: GsapCore,
  opts: ChatPopupTimelineOpts
): Timeline {
  const {
    popupEl,
    reducedMotion = false,
    onComplete,
  } = opts

  const finish = () => {
    killInlineTransform(gsap, popupEl)
    onComplete?.()
  }

  const tl = gsap.timeline({ onComplete: finish })

  if (reducedMotion) {
    gsap.set(popupEl, { scale: CHAT_MOTION.popupToScale, opacity: 0 })
    tl.set({}, {}, 0)
    return tl
  }

  tl.to(popupEl, {
    scale: CHAT_MOTION.popupToScale,
    opacity: 0,
    duration: CHAT_MOTION.popupClose,
    ease: CHAT_MOTION.easeIn,
    overwrite: "auto",
  })

  return tl
}

/**
 * Push-style view change (e.g. chat → settings): current recedes, next slides in.
 * Both views should be positioned (absolute/relative) in the same stacking context.
 */
export function transitionChatViews(
  gsap: GsapCore,
  opts: ChatViewTransitionOpts
): Timeline {
  const {
    currentView,
    nextView,
    enterFromSign = 1,
    reducedMotion = false,
    onComplete,
  } = opts

  const tl = gsap.timeline({
    onComplete: () => {
      killInlineTransform(gsap, currentView)
      killInlineTransform(gsap, nextView)
      onComplete?.()
    },
  })

  if (reducedMotion) {
    gsap.set(currentView, { autoAlpha: 0 })
    gsap.set(nextView, { display: "block", autoAlpha: 1, xPercent: 0 })
    tl.set({}, {}, 0)
    return tl
  }

  const enterFrom = enterFromSign * CHAT_MOTION.viewXPercent

  tl.to(
    currentView,
    {
      xPercent: -enterFromSign * CHAT_MOTION.viewRecedeXPercent,
      opacity: CHAT_MOTION.viewRecedeOpacity,
      scale: CHAT_MOTION.viewRecedeScale,
      duration: CHAT_MOTION.viewDuration,
      ease: CHAT_MOTION.viewEase,
      force3D: true,
    },
    0
  ).fromTo(
    nextView,
    {
      display: "block",
      xPercent: enterFrom,
      opacity: 1,
      force3D: true,
    },
    {
      xPercent: 0,
      duration: CHAT_MOTION.viewDuration + 0.05,
      ease: CHAT_MOTION.ease,
    },
    0
  )

  return tl
}
