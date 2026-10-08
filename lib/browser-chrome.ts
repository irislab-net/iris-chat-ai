/** Hex tints aligned with `--background` in `app/globals.css` (light/dark). */
export const BROWSER_CHROME_COLORS = {
  light: "#ffffff",
  /** Matches `--background` light/dark in `app/globals.css` (`oklch(1 0 0)` / `oklch(0.145 0 0)`). */
  dark: "#0a0a0a",
} as const

/**
 * Empty-state horizon stops — keep in sync with `--horizon-chrome-*`
 * in `app/globals.css` and `.chat-gemini-horizon-dome` in `chat-gemini.css`.
 */
export const HORIZON_CHROME_COLORS = {
  light: {
    /** Sampled from Gemini empty-state header field. */
    top: "#f5f5f5",
    /**
     * Visible wash at the viewport bottom — 84% stop of `.chat-gemini-horizon-dome`.
     * The 100% stop (#9cd1fd) sits in the -18% overdraw, off-screen; using it as a
     * solid fill made a saturated band behind the composer.
     */
    bottom: "#bfe3fc",
  },
  dark: {
    top: "#0a0a0a",
    /** Fallback if `color-mix` cannot be resolved in this runtime. */
    bottom: "#122761",
  },
} as const

/**
 * Pre-hydration chrome sync lives in `/public/scripts/browser-chrome-init.js`
 * (loaded via next/script beforeInteractive). Keep colors in sync with that file.
 *
 * Never remove React/Next-owned theme-color nodes — update content in place.
 */
export const BROWSER_CHROME_INIT_SCRIPT = `(function(){try{var k="theme",s=localStorage.getItem(k),m=matchMedia("(prefers-color-scheme: dark)").matches,d=s==="dark"||(s!=="light"&&m),scheme=d?"dark":"light",c=d?"${BROWSER_CHROME_COLORS.dark}":"${BROWSER_CHROME_COLORS.light}",r=document.documentElement;r.style.setProperty("color-scheme",scheme,"important");r.style.setProperty("--browser-chrome-color",c);r.style.setProperty("--browser-chrome-top",c);r.style.setProperty("--browser-chrome-bottom",c);var colorSchemeMeta=document.querySelector('meta[name="color-scheme"]');if(!colorSchemeMeta){colorSchemeMeta=document.createElement("meta");colorSchemeMeta.setAttribute("name","color-scheme");document.head.appendChild(colorSchemeMeta);}colorSchemeMeta.setAttribute("content",scheme);var metas=document.querySelectorAll('meta[name="theme-color"]');if(!metas.length){var meta=document.createElement("meta");meta.setAttribute("name","theme-color");meta.setAttribute("content",c);document.head.appendChild(meta);}else{for(var i=0;i<metas.length;i++)metas[i].setAttribute("content",c);}var apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(!apple){apple=document.createElement("meta");apple.setAttribute("name","apple-mobile-web-app-status-bar-style");document.head.appendChild(apple);}apple.setAttribute("content","black-translucent");var standalone=(window.navigator&&window.navigator.standalone===true)||(window.matchMedia&&(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: fullscreen)").matches));if(standalone){r.classList.add("display-standalone");try{if(sessionStorage.getItem("exur-pwa-splash-seen")==="1")r.classList.add("pwa-splash-done");}catch(_s){}}else{r.classList.add("pwa-splash-done");}}catch(e){}})();`

export type BrowserChromeTheme = keyof typeof BROWSER_CHROME_COLORS

export type BrowserChromeEdges = {
  top: string
  bottom: string
}

export function resolveBrowserChromeTheme(
  resolvedTheme: string | undefined
): BrowserChromeTheme {
  return resolvedTheme === "light" ? "light" : "dark"
}

export function browserChromeColor(resolvedTheme: string | undefined): string {
  return BROWSER_CHROME_COLORS[resolveBrowserChromeTheme(resolvedTheme)]
}

export function browserChromeEdgesForState(input: {
  theme: BrowserChromeTheme
  horizonVisible: boolean
}): BrowserChromeEdges {
  const fallback = BROWSER_CHROME_COLORS[input.theme]
  if (!input.horizonVisible) {
    return { top: fallback, bottom: fallback }
  }

  return {
    top: HORIZON_CHROME_COLORS[input.theme].top,
    bottom: HORIZON_CHROME_COLORS[input.theme].bottom,
  }
}

function readThemeFromDocument(): BrowserChromeTheme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function isStandaloneDisplay(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("display-standalone")
}

/** iOS Safari tints the bottom toolbar with `theme-color`; Chrome uses it on top. */
export function prefersToolbarThemeColor(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
  maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints,
  platform = typeof navigator === "undefined" ? "" : navigator.platform
): boolean {
  if (/iP(hone|ad|od)/.test(userAgent)) return true
  return platform === "MacIntel" && maxTouchPoints > 1
}

function themeColorForEdges(edges: BrowserChromeEdges): string {
  // Home Screen PWA: status bar reads theme-color (top edge).
  if (isStandaloneDisplay()) return edges.top
  // iOS Safari paints the bottom toolbar with theme-color — that is the
  // edge that must track the horizon wash. Elsewhere the status bar uses it.
  if (prefersToolbarThemeColor()) return edges.bottom
  // Non-iOS browsers: still prefer the bottom wash while the empty-state
  // horizon is up, so the browser chrome matches the visible page edge the
  // user notices first (composer / home-indicator).
  if (edges.bottom !== edges.top) return edges.bottom
  return edges.top
}

export function isHorizonWashVisible(): boolean {
  if (typeof document === "undefined") return false
  if (document.documentElement.hasAttribute("data-overlay-open")) return false

  // Class signal is authoritative — computed opacity is 0 while Gemini CSS is
  // still lazy-loading or mid-fade, which previously left theme-color stuck on
  // the flat fallback until (or unless) Safari noticed a later meta update.
  const layer = document.querySelector(
    ".chat-gemini-bg.chat-gemini-bg-visible"
  )
  if (!(layer instanceof HTMLElement)) return false
  if (layer.classList.contains("chat-gemini-bg-hidden")) return false
  if (!layer.querySelector(".chat-gemini-horizon-dome")) return false

  const style = getComputedStyle(layer)
  if (style.visibility === "hidden") return false
  return true
}

function readBrowserChromeEdges(theme: BrowserChromeTheme): BrowserChromeEdges {
  return browserChromeEdgesForState({
    theme,
    horizonVisible: isHorizonWashVisible(),
  })
}

function syncAppleStatusBarStyle(_theme: BrowserChromeTheme) {
  if (typeof document === "undefined") return

  const meta = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  )

  if (meta) {
    // Always translucent so the web app paints edge-to-edge under the status bar
    // (required for Home Screen PWAs; "default" letterboxes a solid system bar).
    meta.setAttribute("content", "black-translucent")
  }
}

/**
 * Sync theme-color for browser chrome.
 * iOS Safari often ignores in-place `content` updates (and media-qualified
 * tags) after the first paint — replace with one unconditional meta when the
 * color changes so the toolbar actually retints.
 */
function syncThemeColorMeta(color: string) {
  if (typeof document === "undefined") return

  const existing = document.querySelectorAll('meta[name="theme-color"]')

  if (prefersToolbarThemeColor()) {
    const sole = existing.length === 1 ? existing[0] : null
    const alreadyApplied =
      sole !== null &&
      !sole.hasAttribute("media") &&
      sole.getAttribute("content") === color
    if (alreadyApplied) return

    for (const node of existing) node.remove()
    const meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    meta.setAttribute("content", color)
    document.head.appendChild(meta)
    return
  }

  if (existing.length === 0) {
    const meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    meta.setAttribute("content", color)
    document.head.appendChild(meta)
    return
  }

  for (const node of existing) {
    if (node.getAttribute("content") !== color) {
      node.setAttribute("content", color)
    }
  }
}

/** Single active scheme for the document — required so embedded GIS iframes match site theme. */
export function syncDocumentColorScheme(theme: BrowserChromeTheme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.style.setProperty("color-scheme", theme, "important")

  let meta = document.querySelector('meta[name="color-scheme"]')
  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("name", "color-scheme")
    document.head.appendChild(meta)
  }
  meta.setAttribute("content", theme)
}

/**
 * Safari 26+ ignores theme-color and samples fixed edge fills. Drive height +
 * solid background via inline styles so tint works before CSS lands and is not
 * wiped by transparent / backdrop-filter siblings at the viewport edge.
 */
function applySafariEdgeTintStrips(edges: BrowserChromeEdges) {
  if (typeof document === "undefined") return
  if (isStandaloneDisplay()) return

  const root = document.documentElement
  root.style.backgroundColor = edges.top
  if (document.body) {
    // A full-viewport solid body (especially `position:fixed`) is what Safari
    // 26 samples — and what showed as the saturated blue band under the
    // composer and white history drawer. Keep the shell body out of sampling.
    if (root.hasAttribute("data-app-shell")) {
      document.body.style.position = "absolute"
      document.body.style.backgroundColor = "transparent"
    } else {
      document.body.style.removeProperty("position")
      document.body.style.backgroundColor = edges.bottom
    }
  }

  const specs: Array<{
    edge: "top" | "bottom"
    color: string
  }> = [
    { edge: "top", color: edges.top },
    { edge: "bottom", color: edges.bottom },
  ]

  for (const { edge, color } of specs) {
    let node = document.querySelector<HTMLElement>(
      `[data-browser-chrome-tint="${edge}"]`
    )
    if (!node) {
      node = document.createElement("div")
      node.setAttribute("aria-hidden", "true")
      node.setAttribute("data-browser-chrome-tint", edge)
      // Attach to <html> so strips are not trapped inside overflow/fixed body.
      root.appendChild(node)
    } else if (node.parentElement !== root) {
      root.appendChild(node)
    }
    node.style.position = "fixed"
    node.style.left = "0"
    node.style.right = "0"
    node.style.width = "100%"
    node.style.zIndex = "2147483646"
    node.style.pointerEvents = "none"
    node.style.backgroundImage = "none"
    node.style.backdropFilter = "none"
    node.style.setProperty("-webkit-backdrop-filter", "none")
    // Safari 26 still samples `visibility: hidden` edge fills; hiding them
    // removes the 12px solid band the user could see above the toolbar.
    node.style.visibility = "hidden"
    node.style.height = "12px"
    node.style.minHeight = "12px"
    node.style.backgroundColor = color
    if (edge === "top") {
      node.style.top = "0"
      node.style.bottom = "auto"
    } else {
      node.style.bottom = "0"
      node.style.top = "auto"
    }
  }
}

function applyBrowserChromeEdges(edges: BrowserChromeEdges) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.style.setProperty("--browser-chrome-top", edges.top)
  root.style.setProperty("--browser-chrome-bottom", edges.bottom)
  syncThemeColorMeta(themeColorForEdges(edges))
  applySafariEdgeTintStrips(edges)
}

/** Sync CSS chrome tokens + theme-color after hydration / theme / page-edge changes. */
export function syncBrowserChromeTheme(resolvedTheme: string | undefined) {
  if (typeof document === "undefined") return

  const theme = resolvedTheme
    ? resolveBrowserChromeTheme(resolvedTheme)
    : readThemeFromDocument()
  const color = BROWSER_CHROME_COLORS[theme]
  const root = document.documentElement
  const horizonVisible = isHorizonWashVisible()
  const edges = readBrowserChromeEdges(theme)
  const themeColor = themeColorForEdges(edges)
  const iosToolbar = prefersToolbarThemeColor()

  syncDocumentColorScheme(theme)
  root.style.setProperty("--browser-chrome-color", color)
  applyBrowserChromeEdges(edges)
  syncAppleStatusBarStyle(theme)

  // #region agent log
  {
    const metas = Array.from(
      document.querySelectorAll('meta[name="theme-color"]')
    ).map((node) => ({
      content: node.getAttribute("content"),
      media: node.getAttribute("media"),
    }))
    const apple = document
      .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      ?.getAttribute("content")
    const htmlBg = getComputedStyle(root).backgroundColor
    const bodyBg = document.body
      ? getComputedStyle(document.body).backgroundColor
      : null
    const safeTop = getComputedStyle(root).getPropertyValue("--app-safe-top")
    const safeBottom = getComputedStyle(root).getPropertyValue(
      "--app-safe-bottom"
    )
    let safeAreaProbeTop = null as string | null
    let safeAreaProbeBottom = null as string | null
    if (document.body) {
      const probe = document.createElement("div")
      probe.setAttribute("aria-hidden", "true")
      probe.style.cssText =
        "position:absolute;width:0;height:0;overflow:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)"
      document.body.appendChild(probe)
      const probeStyle = getComputedStyle(probe)
      safeAreaProbeTop = probeStyle.paddingTop
      safeAreaProbeBottom = probeStyle.paddingBottom
      probe.remove()
    }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const htmlStyle = getComputedStyle(root)
    const bodyStyle = document.body ? getComputedStyle(document.body) : null
    const layerSnapshot = (
      el: Element | null,
      role: string
    ): Record<string, unknown> | null => {
      if (!(el instanceof HTMLElement)) return null
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        role,
        tag: el.tagName,
        pos: s.position,
        bg: s.backgroundColor,
        backdrop: s.backdropFilter,
        webkitBackdrop: s.getPropertyValue("-webkit-backdrop-filter"),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        h: Math.round(r.height),
        w: Math.round(r.width),
        z: s.zIndex,
        overflow: s.overflow,
        parent: el.parentElement?.tagName ?? null,
        nearTop: r.top <= 4 && r.bottom > 0,
        nearBot: r.bottom >= vh - 4 && r.top < vh,
      }
    }
    const edgeLayers = [
      layerSnapshot(root, "html"),
      layerSnapshot(document.body, "body"),
      layerSnapshot(
        document.querySelector('[data-browser-chrome-tint="top"]'),
        "tint-top"
      ),
      layerSnapshot(
        document.querySelector('[data-browser-chrome-tint="bottom"]'),
        "tint-bottom"
      ),
      layerSnapshot(
        document.querySelector(".app-mobile-safe-header"),
        "header"
      ),
      layerSnapshot(
        document.querySelector('[data-slot="chat-composer"]'),
        "composer"
      ),
      layerSnapshot(
        document.querySelector('[data-slot="chat-composer"]')?.parentElement ??
          null,
        "composer-dock"
      ),
    ].filter(Boolean)
    const payload = {
      sessionId: "649b23",
      runId: "post-fix-hidden-strips",
      hypothesisId: "R",
      location: "lib/browser-chrome.ts:syncBrowserChromeTheme",
      message: "browser chrome sync",
      data: {
        path: window.location.pathname,
        host: window.location.host,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext,
        theme,
        resolvedTheme: resolvedTheme ?? null,
        horizonVisible,
        edges,
        themeColor,
        iosToolbar,
        standalone: isStandaloneDisplay(),
        appShell: root.getAttribute("data-app-shell"),
        overlayOpen: root.getAttribute("data-overlay-open"),
        htmlClass: root.className,
        htmlBg,
        bodyBg,
        htmlOverflow: htmlStyle.overflow,
        htmlPosition: htmlStyle.position,
        cssChromeTop: root.style.getPropertyValue("--browser-chrome-top"),
        cssChromeBottom: root.style.getPropertyValue(
          "--browser-chrome-bottom"
        ),
        safeTop,
        safeBottom,
        safeAreaProbeTop,
        safeAreaProbeBottom,
        vw,
        vh,
        vvH: window.visualViewport?.height ?? null,
        edgeLayers,
        tintTop: Boolean(
          document.querySelector('[data-browser-chrome-tint="top"]')
        ),
        tintBottom: Boolean(
          document.querySelector('[data-browser-chrome-tint="bottom"]')
        ),
        tintParent: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="top"]'
          )
          return el?.parentElement?.tagName ?? null
        })(),
        bodyPosition: bodyStyle?.position ?? null,
        bodyBgInline: document.body?.style.backgroundColor || null,
        htmlBgInline: root.style.backgroundColor || null,
        tintVisibility: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="bottom"]'
          )
          return el instanceof HTMLElement
            ? getComputedStyle(el).visibility
            : null
        })(),
        tintTopH: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="top"]'
          )
          return el instanceof HTMLElement
            ? getComputedStyle(el).height
            : null
        })(),
        tintBottomH: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="bottom"]'
          )
          return el instanceof HTMLElement
            ? getComputedStyle(el).height
            : null
        })(),
        tintTopBg: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="top"]'
          )
          return el instanceof HTMLElement
            ? getComputedStyle(el).backgroundColor
            : null
        })(),
        tintBottomBg: (() => {
          const el = document.querySelector(
            '[data-browser-chrome-tint="bottom"]'
          )
          return el instanceof HTMLElement
            ? getComputedStyle(el).backgroundColor
            : null
        })(),
        themeColorMetaCount: metas.length,
        themeColorHasMedia: metas.some((m) => Boolean(m.media)),
        metas,
        apple,
        ua: navigator.userAgent.slice(0, 160),
      },
      timestamp: Date.now(),
    }
    const body = JSON.stringify(payload)
    // Same-origin proxy works from phone WiFi; localhost ingest only from desktop.
    fetch("/api/debug-session-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {})
    fetch(
      "http://127.0.0.1:7720/ingest/3be29a1b-f239-4020-9d2c-1ec85b598a76",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "649b23",
        },
        body,
      }
    ).catch(() => {})
  }
  // #endregion
}
