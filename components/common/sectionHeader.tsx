import { cn } from "@/lib/utils"
import Heading from "./heading"

function SectionHeader({
  id,
  header,
  level,
  description,
  descriptionClassName,
  className,
  children,
}: {
  id?: string
  header?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  description?: string
  descriptionClassName?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      id={id}
      className={cn("flex flex-col gap-2 md:gap-5 w-full", className)}
    >
      {header && (
        <Heading level={level} scrollTrigger className='text-2xl md:text-4xl'>
          {header}
        </Heading>
      )}

      {description && (
        <p
          className={cn(
            "text-base md:text-xl text-muted-foreground leading-7 font-medium max-w-md",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}

      {children}
    </div>
  )
}

export default SectionHeader
