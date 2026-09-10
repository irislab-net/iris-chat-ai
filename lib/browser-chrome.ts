/** Hex tints aligned with `--background` in `app/globals.css` (light/dark). */
export const BROWSER_CHROME_COLORS = {
  light: "#f5f5f5",
  dark: "#252525",
} as const

export type BrowserChromeTheme = keyof typeof BROWSER_CHROME_COLORS

export function resolveBrowserChromeTheme(
  resolvedTheme: string | undefined
): BrowserChromeTheme {
  return resolvedTheme === "light" ? "light" : "dark"
}

export function browserChromeColor(resolvedTheme: string | undefined): string {
  return BROWSER_CHROME_COLORS[resolveBrowserChromeTheme(resolvedTheme)]
}

export function syncBrowserChromeTheme(resolvedTheme: string | undefined) {
  if (typeof document === "undefined") return

  const theme = resolveBrowserChromeTheme(resolvedTheme)
  const color = BROWSER_CHROME_COLORS[theme]

  document.documentElement.style.colorScheme = theme

  const metas = document.querySelectorAll('meta[name="theme-color"]')
  if (metas.length === 0) {
    const meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    meta.setAttribute("content", color)
    document.head.appendChild(meta)
    return
  }

  metas.forEach((meta) => {
    meta.setAttribute("content", color)
  })
}
