import * as React from "react"
import en from "@/messages/en.json"

type Dict = Record<string, unknown>

const catalogs: Record<string, Dict> = { en: en as Dict }

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function createTranslator(namespace: string, locale = "en") {
  const root = catalogs[locale] ?? catalogs.en
  const ns = namespace ? getByPath(root, namespace) : root

  function t(key: string, values?: Record<string, string | number | Date>) {
    const raw = getByPath(ns, key)
    let str =
      typeof raw === "string"
        ? raw
        : typeof raw === "number"
          ? String(raw)
          : key
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }
    return str
  }

  t.rich = (
    key: string,
    values?: Record<
      string,
      string | number | ((chunks: React.ReactNode) => React.ReactNode)
    >
  ) => {
    const template = t(key)
    if (!values) return template
    // next-intl style: "I agree to the <link>Terms</link>"
    const parts: React.ReactNode[] = []
    const re = /<(\w+)>([\s\S]*?)<\/\1>/g
    let last = 0
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = re.exec(template))) {
      if (match.index > last) parts.push(template.slice(last, match.index))
      const name = match[1]
      const inner = match[2]
      const val = values[name]
      if (typeof val === "function") {
        parts.push(
          <React.Fragment key={idx++}>{val(inner)}</React.Fragment>
        )
      } else if (val != null) {
        parts.push(String(val))
      } else {
        parts.push(inner)
      }
      last = match.index + match[0].length
    }
    if (last < template.length) parts.push(template.slice(last))
    return parts.length ? <>{parts}</> : template
  }

  t.has = (key: string) => typeof getByPath(ns, key) === "string"
  t.raw = (key: string) => getByPath(ns, key)
  return t
}

const LocaleContext = React.createContext("en")

export function NextIntlClientProvider({
  children,
  locale = "en",
}: {
  children: React.ReactNode
  locale?: string
  messages?: unknown
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  return React.useContext(LocaleContext)
}

export function useTranslations(namespace = "") {
  const locale = useLocale()
  return React.useMemo(
    () => createTranslator(namespace, locale),
    [namespace, locale]
  )
}

export function useMessages() {
  const locale = useLocale()
  return catalogs[locale] ?? catalogs.en
}
