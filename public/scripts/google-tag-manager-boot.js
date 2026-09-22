window.__exurBootGtm = function (id) {
  if (!id) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  })
  var first = document.getElementsByTagName("script")[0]
  var gtm = document.createElement("script")
  gtm.async = true
  gtm.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id)
  first.parentNode.insertBefore(gtm, first)
}
