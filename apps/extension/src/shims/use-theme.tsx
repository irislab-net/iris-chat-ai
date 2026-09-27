import * as React from "react"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "exur-ext-theme"

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (value: ThemeMode) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === "light" || raw === "dark" || raw === "system") return raw
  } catch {
    /* ignore */
  }
  return "system"
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return systemPrefersDark() ? "dark" : "light"
}

/** Apply before React paint so the first frame matches system preference. */
export function applyThemeToDocument(theme: ThemeMode = readStoredTheme()) {
  const dark = resolveTheme(theme) === "dark"
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>(() =>
    typeof window === "undefined" ? "system" : readStoredTheme()
  )
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    () =>
      typeof window === "undefined" ? "light" : resolveTheme(readStoredTheme())
  )

  const apply = React.useCallback((value: ThemeMode) => {
    const resolved = resolveTheme(value)
    setResolvedTheme(resolved)
    applyThemeToDocument(value)
  }, [])

  React.useEffect(() => {
    apply(theme)
  }, [theme, apply])

  React.useEffect(() => {
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => apply("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme, apply])

  const setTheme = React.useCallback((value: ThemeMode) => {
    setThemeState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    void chrome.storage?.local?.set?.({ [STORAGE_KEY]: value })
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

/** Minimal theme hook for extension prefs (matches @wrksz/themes API surface). */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}
