window.__exurBootGa = function (id) {
  if (!id) return
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag("js", new Date())
  gtag("config", id, { anonymize_ip: true, send_page_view: true })
}
