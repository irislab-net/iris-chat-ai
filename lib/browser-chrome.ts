/** Hex tints aligned with `--background` in `app/globals.css` (light/dark). */
export const BROWSER_CHROME_COLORS = {
  light: "#ffffff",
  /** Matches `--background` light/dark in `app/globals.css` (`oklch(1 0 0)` / `oklch(0.145 0 0)`). */
  dark: "#0a0a0a",
} as const

/**
 * Pre-hydration chrome sync lives in `/public/scripts/browser-chrome-init.js`
 * (loaded via next/script beforeInteractive). Keep colors in sync with that file.
 *
 * Never remove React/Next-owned theme-color nodes — update content in place.
 */
export const BROWSER_CHROME_INIT_SCRIPT = `(function(){try{var k="theme",s=localStorage.getItem(k),m=matchMedia("(prefers-color-scheme: dark)").matches,d=s==="dark"||(s!=="light"&&m),scheme=d?"dark":"light",c=d?"${BROWSER_CHROME_COLORS.dark}":"${BROWSER_CHROME_COLORS.light}",r=document.documentElement;r.style.setProperty("color-scheme",scheme,"important");r.style.setProperty("--browser-chrome-color",c);var colorSchemeMeta=document.querySelector('meta[name="color-scheme"]');if(!colorSchemeMeta){colorSchemeMeta=document.createElement("meta");colorSchemeMeta.setAttribute("name","color-scheme");document.head.appendChild(colorSchemeMeta);}colorSchemeMeta.setAttribute("content",scheme);var metas=document.querySelectorAll('meta[name="theme-color"]');if(!metas.length){var meta=document.createElement("meta");meta.setAttribute("name","theme-color");meta.setAttribute("content",c);document.head.appendChild(meta);}else{for(var i=0;i<metas.length;i++)metas[i].setAttribute("content",c);}var apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(!apple){apple=document.createElement("meta");apple.setAttribute("name","apple-mobile-web-app-status-bar-style");document.head.appendChild(apple);}apple.setAttribute("content","black-translucent");var standalone=(window.navigator&&window.navigator.standalone===true)||(window.matchMedia&&(window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: fullscreen)").matches));if(standalone){r.classList.add("display-standalone");try{if(sessionStorage.getItem("exur-pwa-splash-seen")==="1")r.classList.add("pwa-splash-done");}catch(_s){}}else{r.classList.add("pwa-splash-done");}var ua=(window.navigator&&window.navigator.userAgent)||"";if(/Android/i.test(ua))r.classList.add("ua-android");if(/iPhone|iPad|iPod/i.test(ua))r.classList.add("ua-ios");}catch(e){}})();`

export type BrowserChromeTheme = keyof typeof BROWSER_CHROME_COLORS

export function resolveBrowserChromeTheme(
  resolvedTheme: string | undefined
): BrowserChromeTheme {
  return resolvedTheme === "light" ? "light" : "dark"
}

export function browserChromeColor(resolvedTheme: string | undefined): string {
  return BROWSER_CHROME_COLORS[resolveBrowserChromeTheme(resolvedTheme)]
}

function readThemeFromDocument(): BrowserChromeTheme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
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
 * Force resolved theme onto existing theme-color tags in place.
 * Keep media attributes intact so React/Next keep owning the nodes.
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
    node.setAttribute("content", color)
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

/** Sync CSS chrome tokens + theme-color after hydration / theme changes. */
export function syncBrowserChromeTheme(resolvedTheme: string | undefined) {
  if (typeof document === "undefined") return

  const theme = resolvedTheme
    ? resolveBrowserChromeTheme(resolvedTheme)
    : readThemeFromDocument()
  const color = BROWSER_CHROME_COLORS[theme]
  const root = document.documentElement

  syncDocumentColorScheme(theme)
  root.style.setProperty("--browser-chrome-color", color)
  syncThemeColorMeta(color)
  syncAppleStatusBarStyle(theme)
}
