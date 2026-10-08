import { cn } from "@/lib/utils"
import { CheckCircle, Copy } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

function CopyToClipboard({
  label,
  value,
  className,
  labelClassName,
  children,
}: {
  value?: string
  label?: string
  className?: string
  labelClassName?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!value || copied) return

    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={handleCopy}
      className={cn("group/copy-to-clipboard relative", className)}
    >
      <div className='absolute justify-center bottom-full left-1/2 -translate-x-1/2 flex py-1 px-3 rounded-3xl bg-neutral-700 text-background opacity-0 pointer-events-none group-hover/copy-to-clipboard:opacity-100 group-hover/copy-to-clipboard:-translate-y-2 transition-all duration-300 pointer-events-none'>
        <span className={cn("text-nowrap", labelClassName)}>
          {[copied].map(copied =>
            copied ? (
              <span key='copied' className=' relative animate-appear flex gap-1 text-sm items-center'>
                <CheckCircle className="size-4"/>
                Copied!
              </span>
            ) : (
              <span key='copy' className='block relative animate-appear text-sm'>
                Copy {label} <span className="font-mono text-xs"></span>
              </span>
            )
          )}
        </span>
      </div>

      {children || (
        <Button
          disabled={!value}
          variant='ghost'
          size='icon'
          className='relative'
        >
          <Copy className='size-4' />
        </Button>
      )}
    </div>
  )
}

export default CopyToClipboard
