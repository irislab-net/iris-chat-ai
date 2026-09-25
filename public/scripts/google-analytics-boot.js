window.__exurBootGa = function (id) {
  if (!id) return
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  // Consent already defaulted to denied; grant analytics before config when booting.
  gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
  gtag("js", new Date())
  gtag("config", id, { anonymize_ip: true, send_page_view: true })
}
