/* Consent Mode v2 defaults — must run before GA/GTM.
 * Also hydrates a prior decision from the shared exur.ai cookie so apex + chat
 * stay aligned without waiting for React. */
;(function () {
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = window.gtag || gtag
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  })

  var KEY = "exur-cookie-consent"
  var VERSION = "v1"

  function readCookie(name) {
    var prefix = encodeURIComponent(name) + "="
    var parts = document.cookie.split(";")
    for (var i = 0; i < parts.length; i++) {
      var trimmed = parts[i].trim()
      if (trimmed.indexOf(prefix) !== 0) continue
      try {
        return decodeURIComponent(trimmed.slice(prefix.length))
      } catch (e) {
        return trimmed.slice(prefix.length)
      }
    }
    return null
  }

  function readStored() {
    try {
      var fromLs = localStorage.getItem(KEY)
      if (fromLs) return fromLs
    } catch (e) {
      /* private mode */
    }
    return readCookie(KEY)
  }

  try {
    var raw = readStored()
    if (!raw) return
    var prefs = JSON.parse(raw)
    if (!prefs || prefs.version !== VERSION) return
    if (typeof prefs.analytics !== "boolean") return
    var analytics = prefs.analytics ? "granted" : "denied"
    var advertising = prefs.advertising ? "granted" : "denied"
    gtag("consent", "update", {
      analytics_storage: analytics,
      ad_storage: advertising,
      ad_user_data: advertising,
      ad_personalization: advertising,
    })
  } catch (e) {
    /* ignore corrupt storage */
  }
})()
