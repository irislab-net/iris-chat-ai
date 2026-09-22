type JsonLdProps = {
  id: string
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Invisible structured data for search engines (JSON-LD, not executable JS). */
function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export { JsonLd }
