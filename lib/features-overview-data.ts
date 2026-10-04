/** Feature overview page keys. Copy lives in `featuresPage` i18n. */

export const FEATURES_PATH = "/features"

export const FEATURES_JUMP_LINKS = [
  { href: "#gold", key: "gold" },
  { href: "#tools", key: "tools" },
  { href: "#news", key: "news" },
  { href: "#quality", key: "quality" },
  { href: "#extension", key: "extension" },
  { href: "#clients", key: "clients" },
] as const

export type FeaturesJumpKey = (typeof FEATURES_JUMP_LINKS)[number]["key"]
