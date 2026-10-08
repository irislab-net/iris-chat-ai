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
    /** Sampled from Gemini empty-state bottom edge / home-indicator wash. */
    bottom: "#9cd1fd",
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

function rgbToHex(color: string): string | null {
  const value = color.trim().toLowerCase()
  if (value.startsWith("#")) {
    if (value.length === 7) return value
    if (value.length === 4) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    }
    return null
  }

  const match = value.match(
    /rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)/
  )
  if (!match) return null

  const channels = match.slice(1, 4).map((part) => Math.round(Number(part)))
  if (channels.some((channel) => !Number.isFinite(channel))) return null

  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`
}

function resolveDocumentColor(cssColor: string): string | null {
  if (typeof document === "undefined" || !document.body) return null

  const probe = document.createElement("span")
  probe.setAttribute("aria-hidden", "true")
  probe.style.position = "absolute"
  probe.style.width = "0"
  probe.style.height = "0"
  probe.style.overflow = "hidden"
  probe.style.pointerEvents = "none"
  probe.style.backgroundColor = cssColor
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).backgroundColor
  probe.remove()
  return rgbToHex(computed)
}

export function isHorizonWashVisible(): boolean {
  if (typeof document === "undefined") return false
  if (document.documentElement.hasAttribute("data-overlay-open")) return false

  const wash = document.querySelector(
    ".chat-gemini-bg-visible .chat-gemini-horizon-dome"
  )
  if (!(wash instanceof HTMLElement)) return false

  const layer = wash.closest(".chat-gemini-bg")
  if (layer instanceof HTMLElement && layer.classList.contains("chat-gemini-bg-hidden")) {
    return false
  }

  const style = getComputedStyle(layer instanceof HTMLElement ? layer : wash)
  return style.visibility !== "hidden" && style.opacity !== "0"
}

function readBrowserChromeEdges(theme: BrowserChromeTheme): BrowserChromeEdges {
  const horizonVisible = isHorizonWashVisible()
  const edges = browserChromeEdgesForState({ theme, horizonVisible })
  if (!horizonVisible) return edges

  return {
    top:
      resolveDocumentColor("var(--horizon-chrome-top)") ??
      HORIZON_CHROME_COLORS[theme].top,
    bottom:
      resolveDocumentColor("var(--horizon-chrome-bottom)") ??
      HORIZON_CHROME_COLORS[theme].bottom,
  }
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
 * Force theme-color onto every matching meta (incl. media variants).
 * Keep media attributes intact so Next still owns the nodes; only content
 * is rewritten so iOS Safari toolbar / Android status bar stay in sync.
 */
function syncThemeColorMeta(color: string) {
  if (typeof document === "undefined") return

  const existing = document.querySelectorAll('meta[name="theme-color"]')
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

function applyBrowserChromeEdges(edges: BrowserChromeEdges) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.style.setProperty("--browser-chrome-top", edges.top)
  root.style.setProperty("--browser-chrome-bottom", edges.bottom)
  syncThemeColorMeta(themeColorForEdges(edges))
}

/** Sync CSS chrome tokens + theme-color after hydration / theme / page-edge changes. */
export function syncBrowserChromeTheme(resolvedTheme: string | undefined) {
  if (typeof document === "undefined") return

  const theme = resolvedTheme
    ? resolveBrowserChromeTheme(resolvedTheme)
    : readThemeFromDocument()
  const color = BROWSER_CHROME_COLORS[theme]
  const root = document.documentElement
  const edges = readBrowserChromeEdges(theme)

  syncDocumentColorScheme(theme)
  root.style.setProperty("--browser-chrome-color", color)
  applyBrowserChromeEdges(edges)
  syncAppleStatusBarStyle(theme)
}
