window.__exurBootGa = function (id) {
  if (!id) return
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag("js", new Date())
  gtag("config", id, {
    send_page_view: true,
    anonymize_ip: true,
  })
}
