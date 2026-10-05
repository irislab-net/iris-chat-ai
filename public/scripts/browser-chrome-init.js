/** Pre-hydration browser chrome (theme-color / color-scheme). Keep in sync with lib/browser-chrome.ts. */
(function () {
  try {
    var light = "#ffffff"
    var dark = "#0a0a0a"
    var stored = localStorage.getItem("theme")
    var prefersDark = matchMedia("(prefers-color-scheme: dark)").matches
    // "light" / "dark" force; "system" / null / other → OS preference.
    var isDark = stored === "dark" || (stored !== "light" && prefersDark)
    var scheme = isDark ? "dark" : "light"
    var color = isDark ? dark : light
    var root = document.documentElement
    root.style.setProperty("color-scheme", scheme, "important")
    root.style.setProperty("--browser-chrome-color", color)

    var colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement("meta")
      colorSchemeMeta.setAttribute("name", "color-scheme")
      document.head.appendChild(colorSchemeMeta)
    }
    colorSchemeMeta.setAttribute("content", scheme)

    // Update SSR theme-color tags in place (keep media attrs React owns).
    var metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length === 0) {
      var meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      meta.setAttribute("content", color)
      document.head.appendChild(meta)
    } else {
      for (var i = 0; i < metas.length; i++) {
        metas[i].setAttribute("content", color)
      }
    }

    var apple = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    )
    if (!apple) {
      apple = document.createElement("meta")
      apple.setAttribute("name", "apple-mobile-web-app-status-bar-style")
      document.head.appendChild(apple)
    }
    apple.setAttribute("content", "black-translucent")

    // Home Screen web apps: mark early so CSS can fill 100lvh before React hydrates.
    var standalone =
      (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches))
    if (standalone) {
      root.classList.add("display-standalone")
      // Skip in-app splash on warm session navigations / reloads in-session.
      try {
        if (sessionStorage.getItem("exur-pwa-splash-seen") === "1") {
          root.classList.add("pwa-splash-done")
        }
      } catch (_storage) {}
    } else {
      root.classList.add("pwa-splash-done")
    }

    // Phone UA markers (optional hooks). Sheet blur kill is CSS @media
    // max-width 767px — covers iPhone X Safari + Android Custom Tabs.
    var ua = (window.navigator && window.navigator.userAgent) || ""
    if (/Android/i.test(ua)) {
      root.classList.add("ua-android")
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
      root.classList.add("ua-ios")
    }
  } catch (_e) {}
})()
