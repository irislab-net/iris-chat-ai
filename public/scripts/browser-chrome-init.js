/** Pre-hydration browser chrome (theme-color / color-scheme). Keep in sync with lib/browser-chrome.ts. */
(function () {
  try {
    var light = "#f5f5f5"
    var dark = "#252525"
    var stored = localStorage.getItem("theme")
    var prefersDark = matchMedia("(prefers-color-scheme: dark)").matches
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

    var metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length) {
      for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", color)
    } else {
      var meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      meta.setAttribute("content", color)
      document.head.appendChild(meta)
    }

    var apple = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    )
    if (!apple) {
      apple = document.createElement("meta")
      apple.setAttribute("name", "apple-mobile-web-app-status-bar-style")
      document.head.appendChild(apple)
    }
    apple.setAttribute("content", isDark ? "black-translucent" : "default")
  } catch (_e) {}
})()
