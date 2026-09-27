import * as React from "react"

type Messages = Record<string, string>

const enChat: Messages = {
  "composer.placeholder": "Ask Exur…",
  "composer.send": "Send",
  "composer.stop": "Stop",
  "composer.newChat": "New chat",
  "history.title": "History",
  "history.empty": "No conversations yet",
  "auth.signIn": "Sign in with Google",
  "auth.signOut": "Sign out",
  "auth.guest": "Guest",
  "thinking.label": "Thinking",
  "error.generic": "Something went wrong. Try again.",
  "empty.title": "Exur Chat",
  "empty.subtitle": "Ask about markets, setups, and your desk.",
}

const I18nContext = React.createContext({
  locale: "en",
  t: (key: string) => enChat[key] ?? key,
})

export function ExtensionI18nProvider({
  children,
  locale = "en",
  messages,
}: {
  children: React.ReactNode
  locale?: string
  messages?: Messages
}) {
  const dict = messages ?? enChat
  const value = React.useMemo(
    () => ({
      locale,
      t: (key: string) => dict[key] ?? key,
    }),
    [locale, dict]
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useExtensionT() {
  return React.useContext(I18nContext).t
}

export function useExtensionLocale() {
  return React.useContext(I18nContext).locale
}
