import { defineManifest } from "@crxjs/vite-plugin"

export default defineManifest({
  manifest_version: 3,
  name: "Exur Chat",
  short_name: "Exur",
  description:
    "AI co-pilot in your Chrome side panel — chat, market news, and trade context.",
  version: "0.0.3",
  homepage_url: "https://chat.exur.ai",
  // Stable ID for local/unpacked OAuth only. Stripped by `pnpm extension:pack`.
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4RIebkDmay2Q7vd0yxk+6snozvfWOeGRvGf41BrUvpC12lflX3PN7tbjv7HQCricJxNUzRG2NjJ5ixYvVQlvSjIL+Z7nJUbDdzg6o8LjyF+1iYVdYo2OWSxqOmV5eAMRXAsbGvxOfncoRNgclgAOerMWSUKDIdQX+ulP6Iwz1cRKBIxjoIjBhJ3jGr4z+KLUvDY6URbaI1iH+y9PXECppVQXB8JaizFvcArUdbo0xQd7Hc7tPUpW3laIZccQ7vINd7v8xPY1qigdm6bk0+zw8Cs2+STwtvzLTc/aBjCUHHcDAYozSQfAz8o2D9acbf3K3mE/4Jvr8WZS4LnwMPHgwQIDAQAB",
  // cookies: read HttpOnly refresh_token after Google OAuth lands on callback.html
  // identity: optional legacy Google OIDC helper (launchWebAuthFlow)
  permissions: ["sidePanel", "storage", "identity", "cookies"],
  host_permissions: [
    "https://api.exur.ai/*",
    "https://chat.exur.ai/*",
    "https://assets.coingecko.com/*",
    "https://s3-symbol-logo.tradingview.com/*",
  ],
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; img-src 'self' data: blob: https:;",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  side_panel: {
    default_path: "sidepanel.html",
  },
  action: {
    default_title: "Open Exur Chat",
    default_icon: {
      "16": "icon-16.png",
      "32": "favicon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png",
    },
  },
  icons: {
    "16": "icon-16.png",
    "32": "favicon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png",
    "192": "icon-192.png",
  },
})
