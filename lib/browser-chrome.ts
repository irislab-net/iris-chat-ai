/** Hex tints aligned with `--background` in `app/globals.css` (light/dark). */
export const BROWSER_CHROME_COLORS = {
  light: "#f5f5f5",
  dark: "#252525",
} as const

/**
 * Pre-hydration chrome sync lives in `/public/scripts/browser-chrome-init.js`
 * (loaded via next/script beforeInteractive). Keep colors in sync with that file.
 */
export const BROWSER_CHROME_INIT_SCRIPT = `(function(){try{var k="theme",s=localStorage.getItem(k),m=matchMedia("(prefers-color-scheme: dark)").matches,d=s==="dark"||(s!=="light"&&m),scheme=d?"dark":"light",c=d?"${BROWSER_CHROME_COLORS.dark}":"${BROWSER_CHROME_COLORS.light}",r=document.documentElement;r.style.setProperty("color-scheme",scheme,"important");r.style.setProperty("--browser-chrome-color",c);var colorSchemeMeta=document.querySelector('meta[name="color-scheme"]');if(!colorSchemeMeta){colorSchemeMeta=document.createElement("meta");colorSchemeMeta.setAttribute("name","color-scheme");document.head.appendChild(colorSchemeMeta);}colorSchemeMeta.setAttribute("content",scheme);var metas=document.querySelectorAll('meta[name="theme-color"]');if(metas.length){for(var i=0;i<metas.length;i++)metas[i].setAttribute("content",c);}else{var meta=document.createElement("meta");meta.setAttribute("name","theme-color");meta.setAttribute("content",c);document.head.appendChild(meta);}var apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(!apple){apple=document.createElement("meta");apple.setAttribute("name","apple-mobile-web-app-status-bar-style");document.head.appendChild(apple);}apple.setAttribute("content",d?"black-translucent":"default");}catch(e){}})();`

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

function syncAppleStatusBarStyle(theme: BrowserChromeTheme) {
  if (typeof document === "undefined") return

  const meta = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  )

  if (meta) {
    meta.setAttribute(
      "content",
      theme === "dark" ? "black-translucent" : "default"
    )
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

/** Sync CSS chrome tokens after hydration. Theme-color metas are owned by ThemeProvider. */
export function syncBrowserChromeTheme(resolvedTheme: string | undefined) {
  if (typeof document === "undefined") return

  const theme = resolvedTheme
    ? resolveBrowserChromeTheme(resolvedTheme)
    : readThemeFromDocument()
  const color = BROWSER_CHROME_COLORS[theme]
  const root = document.documentElement

  syncDocumentColorScheme(theme)
  root.style.setProperty("--browser-chrome-color", color)
  syncAppleStatusBarStyle(theme)
}
