import { defineManifest } from "@crxjs/vite-plugin"

export default defineManifest({
  manifest_version: 3,
  name: "Exur Chat",
  description: "Exur co-pilot chat in your browser side panel",
  version: "0.0.1",
  // Stable ID for Google OAuth redirect_uri (do not rotate casually).
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4RIebkDmay2Q7vd0yxk+6snozvfWOeGRvGf41BrUvpC12lflX3PN7tbjv7HQCricJxNUzRG2NjJ5ixYvVQlvSjIL+Z7nJUbDdzg6o8LjyF+1iYVdYo2OWSxqOmV5eAMRXAsbGvxOfncoRNgclgAOerMWSUKDIdQX+ulP6Iwz1cRKBIxjoIjBhJ3jGr4z+KLUvDY6URbaI1iH+y9PXECppVQXB8JaizFvcArUdbo0xQd7Hc7tPUpW3laIZccQ7vINd7v8xPY1qigdm6bk0+zw8Cs2+STwtvzLTc/aBjCUHHcDAYozSQfAz8o2D9acbf3K3mE/4Jvr8WZS4LnwMPHgwQIDAQAB",
  permissions: ["sidePanel", "storage", "identity"],
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
  },
  icons: {
    "32": "favicon-32.png",
    "128": "icon-128.png",
    "192": "icon-192.png",
  },
})
