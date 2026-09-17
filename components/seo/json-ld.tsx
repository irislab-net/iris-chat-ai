import Script from "next/script"

type JsonLdProps = {
  id: string
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Invisible structured data for search engines. */
function JsonLd({ id, data }: JsonLdProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export { JsonLd }
