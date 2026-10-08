import { generateHrefId } from "@/lib/utils"
import type { ContentOutline } from "@/types/outline"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Heading from "./heading"

function MarkdownSkeleton({ header }: { header?: string }) {
  return (
    <div className='flex flex-col gap-2'>
      {/* Title skeleton */}
      <div className='space-y-2'>
        {header ? (
          <Heading level={1} className='text-2xl md:text-5xl'>
            {header}
          </Heading>
        ) : (
          <div className='h-12 w-64 bg-neutral-200 rounded-full' />
        )}

        <div className='h-5 w-40 bg-neutral-200 rounded-full' />
      </div>

      <div className='flex flex-col gap-2 animate-pulse'>
        {/* Divider */}
        <div className='h-px bg-neutral-200' />

        {/* Introduction section */}
        <div className='space-y-3'>
          <div className='h-6 w-32 bg-neutral-200 rounded-full mt-4' />

          <div className='space-y-2'>
            <div className='h-4 w-full bg-neutral-200 rounded-full' />
            <div className='h-4 w-4/5 bg-neutral-200 rounded-full' />
            <div className='h-4 w-3/4 bg-neutral-200 rounded-full' />
          </div>
        </div>

        {/* Section with subsections */}
        <div className='space-y-4'>
          <div className='h-6 w-40 bg-neutral-200 rounded-full mt-4' />

          <div className='space-y-3 ml-4'>
            <div className='h-5 w-36 bg-neutral-200 rounded-full' />
            <div className='space-y-2'>
              <div className='h-4 w-full bg-neutral-200 rounded-full' />
              <div className='h-4 w-5/6 bg-neutral-200 rounded-full' />
              <div className='h-4 w-4/5 bg-neutral-200 rounded-full' />
            </div>
            <div className='h-5 w-32 bg-neutral-200 rounded-full' />
            <div className='space-y-2'>
              <div className='h-4 w-full bg-neutral-200 rounded-full' />
              <div className='h-4 w-3/4 bg-neutral-200 rounded-full' />
            </div>
          </div>
        </div>

        {/* List section */}
        <div className='space-y-3'>
          <div className='h-6 w-44 bg-neutral-200 rounded-full mt-4' />

          <div className='space-y-2 ml-4'>
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 bg-neutral-200 rounded-full' />
              <div className='h-4 w-48 bg-neutral-200 rounded-full' />
            </div>
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 bg-neutral-200 rounded-full' />
              <div className='h-4 w-52 bg-neutral-200 rounded-full' />
            </div>
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 bg-neutral-200 rounded-full' />
              <div className='h-4 w-40 bg-neutral-200 rounded-full' />
            </div>
          </div>
        </div>

        {/* Another section */}
        <div className='space-y-4'>
          <div className='h-6 w-36 bg-neutral-200 rounded-full mt-4' />

          <div className='space-y-2'>
            <div className='h-4 w-full bg-neutral-200 rounded-full' />
            <div className='h-4 w-4/5 bg-neutral-200 rounded-full' />
            <div className='h-4 w-3/4 bg-neutral-200 rounded-full' />
          </div>
        </div>

        {/* Contact section */}
        <div className='space-y-3'>
          <div className='h-6 w-28 bg-neutral-200 rounded-full mt-4' />

          <div className='space-y-2'>
            <div className='h-4 w-56 bg-neutral-200 rounded-full' />
            <div className='h-4 w-48 bg-neutral-200 rounded-full' />
            <div className='h-4 w-44 bg-neutral-200 rounded-full' />
          </div>
        </div>

        {/* Footer */}
        <div className='h-px bg-neutral-200 mt-4' />
        <div className='h-4 w-3/4 bg-neutral-200 rounded-full' />
      </div>
    </div>
  )
}

function MarkdownRenderer({
  content,
  url,
  skeletonHeader,
  onLoad,
}: {
  content?: string
  url?: string
  skeletonHeader?: string
  onLoad?: (outline: ContentOutline[]) => void
}) {
  const [markdown, setMarkdown] = useState<string>(content ?? "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMarkdown = async () => {
      if (url) {
        try {
          setLoading(true)

          const res = await fetch(url)
          const md = await res.text()

          setMarkdown(md)

          const lines = md.split("\n")

          if (lines[0].startsWith("<!DOCTYPE html>"))
            throw new Error("Invalid markdown file")

          const outline: ContentOutline[] =
            lines
              .filter(line => line.startsWith("#"))
              .map(line => {
                const [, level, title] = line.match(/(#+)\s+(.*)/)!

                return {
                  id: generateHrefId(title),
                  title,
                  level: level.length as 1 | 2 | 3,
                }
              }) ?? []

          onLoad?.(outline)
        } catch {
          setMarkdown("Unfortunately, something went wrong.")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchMarkdown()
  }, [url, content, onLoad])

  return (
    <>
      {loading && <MarkdownSkeleton header={skeletonHeader} />}

      {!loading && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Override paragraph styling to match the design
            p: ({ children }) => (
              <p className='text-sm text-neutral-500 animate-fade-in'>
                {children}
              </p>
            ),

            // Style code blocks
            code: ({ children, className }) => {
              const isInline = !className
              return isInline ? (
                <code className='bg-muted px-2 py-1 rounded text-xs font-mono animate-fade-in rounded-md'>
                  {children}
                </code>
              ) : (
                <code className='block bg-muted p-2 rounded text-xs font-mono overflow-x-auto animate-fade-in rounded-md'>
                  {children}
                </code>
              )
            },

            // Style code blocks with language
            pre: ({ children }) => (
              <pre className='bg-muted p-2 rounded text-xs font-mono overflow-x-auto animate-fade-in'>
                {children}
              </pre>
            ),

            // Style lists
            ul: ({ children }) => (
              <ul className='list-disc list-inside mt-2 space-y-1 animate-fade-in'>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className='list-decimal list-inside mt-2 space-y-1 animate-fade-in'>
                {children}
              </ol>
            ),

            // Style links
            a: ({ children, href }) => (
              <a
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-500 underline decoration-primary-200  hover:text-primary-600 font-medium'
              >
                {children}
              </a>
            ),

            // Style blockquotes
            blockquote: ({ children }) => (
              <blockquote className='border-l-4 border-primary/20 pl-3 italic text-muted-foreground animate-fade-in'>
                {children}
              </blockquote>
            ),

            // Style headers
            h1: ({ children }) => (
              <Heading
                level={1}
                id={generateHrefId(children?.toString() ?? "")}
                className='text-2xl md:text-5xl animate-fade-in'
              >
                {children}
              </Heading>
            ),
            h2: ({ children }) => (
              <Heading
                level={2}
                id={generateHrefId(children?.toString() ?? "")}
                className='text-xl md:text-2xl mt-4 animate-fade-in'
              >
                {children}
              </Heading>
            ),
            h3: ({ children }) => (
              <Heading
                level={3}
                id={generateHrefId(children?.toString() ?? "")}
                className='md:text-lg mt-2 animate-fade-in'
              >
                {children}
              </Heading>
            ),
            strong: ({ children }) => <Heading>{children}</Heading>,

            // Style tables
            table: ({ children }) => (
              <div className='overflow-x-auto !max-w-[90vw] animate-fade-in my-4'>
                <table className='min-w-full border-collapse'>{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className='bg-neutral-50 [&>tr>th:first-child]:rounded-ss-md [&>tr>th:last-child]:rounded-se-md'>
                {children}
              </thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className='hover:bg-neutral-50/50 transition-colors'>
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className='px-3 py-2 text-left bg-neutral-50 font-semibold text-xs'>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className='border border-neutral-100 px-3 py-2 text-xs'>
                {children}
              </td>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      )}
    </>
  )
}

export default MarkdownRenderer
