import { cn } from "@/lib/utils"
import type { SVGIcon } from "@/types/icon"
import { ArrowRight } from "lucide-react"
import React from "react"

function List({
  items = [],
  type = "unordered",
  iconClassName,
  icon = ArrowRight,
  className,
}: {
  items?: string[]
  type?: "ordered" | "unordered"
  icon?: SVGIcon
  iconClassName?: string
  className?: string
}) {
  const isOrdered = type === "ordered"

  const iconElement =
    icon &&
    !isOrdered &&
    React.createElement(icon, {
      className: cn("size-4", iconClassName),
    })

  return React.createElement(
    isOrdered ? "ol" : "ul",
    {
      className: cn(
        "space-y-4 text-sm text-neutral-700",
        isOrdered && "list-decimal list-inside",
        className
      ),
    },
    <>
      {items.map((item, index) => (
        <li key={index} className={cn(!isOrdered && "flex items-start gap-2")}>
          {iconElement}

          <span className='text-sm leading-tight'>{item}</span>
        </li>
      ))}
    </>
  )
}

export default List
