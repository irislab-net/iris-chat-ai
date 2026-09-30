import * as React from "react"

import ar from "@/messages/ar.json"
import en from "@/messages/en.json"
import es from "@/messages/es.json"
import fa from "@/messages/fa.json"
import nl from "@/messages/nl.json"
import pt from "@/messages/pt.json"
import ru from "@/messages/ru.json"
import tr from "@/messages/tr.json"
import { routing, type AppLocale } from "@/i18n/routing"

type Dict = Record<string, unknown>

const catalogs: Record<string, Dict> = {
  ar: ar as Dict,
  en: en as Dict,
  es: es as Dict,
  fa: fa as Dict,
  nl: nl as Dict,
  pt: pt as Dict,
  ru: ru as Dict,
  tr: tr as Dict,
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function resolveMessage(
  locale: string,
  namespace: string,
  key: string
): unknown {
  const root = catalogs[locale] ?? catalogs.en
  const ns = namespace ? getByPath(root, namespace) : root
  const local = getByPath(ns, key)
  if (local !== undefined) return local
  if (locale === "en") return undefined
  const enRoot = catalogs.en
  const enNs = namespace ? getByPath(enRoot, namespace) : enRoot
  return getByPath(enNs, key)
}

function interpolateScalars(
  template: string,
  values?: Record<string, string | number | Date | unknown>
) {
  if (!values) return template
  let str = template
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === "function") continue
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
  }
  return str
}

function createTranslator(namespace: string, locale = "en") {
  function t(key: string, values?: Record<string, string | number | Date>) {
    const raw = resolveMessage(locale, namespace, key)
    const str =
      typeof raw === "string"
        ? raw
        : typeof raw === "number"
          ? String(raw)
          : key
    return interpolateScalars(str, values)
  }

  t.rich = (
    key: string,
    values?: Record<
      string,
      string | number | ((chunks: React.ReactNode) => React.ReactNode)
    >
  ) => {
    const raw = resolveMessage(locale, namespace, key)
    // Interpolate {name} etc. before parsing <highlight>…</highlight> tags.
    const template = interpolateScalars(
      typeof raw === "string" ? raw : key,
      values
    )
    if (!values) return template

    const parts: React.ReactNode[] = []
    const re = /<(\w+)>([\s\S]*?)<\/\1>/g
    let last = 0
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = re.exec(template))) {
      if (match.index > last) parts.push(template.slice(last, match.index))
      const tag = match[1]
      const inner = match[2]
      const val = values[tag]
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

  t.has = (key: string) => typeof resolveMessage(locale, namespace, key) === "string"
  t.raw = (key: string) => resolveMessage(locale, namespace, key)
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
  const safeLocale = routing.locales.includes(locale as AppLocale)
    ? locale
    : "en"
  return (
    <LocaleContext.Provider value={safeLocale}>{children}</LocaleContext.Provider>
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
