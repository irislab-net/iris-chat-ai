type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Invisible structured data for search engines. */
function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export { JsonLd }
