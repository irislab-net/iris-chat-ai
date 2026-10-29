"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  ...props
}: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center py-2.5">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-foreground/10 dark:bg-white/12"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full rounded-full bg-[#2563EB]"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className={cn(
            "block size-5 shrink-0 rounded-full border border-white/90 bg-white",
            "shadow-[0_1px_3px_rgba(15,23,42,0.18),0_4px_12px_-4px_rgba(37,99,235,0.35)]",
            "transition-[box-shadow,transform] outline-none",
            "focus-visible:ring-3 focus-visible:ring-[#2563EB]/35",
            "dark:border-white/30 dark:bg-white dark:shadow-[0_1px_3px_rgba(0,0,0,0.45),0_4px_12px_-4px_rgba(37,99,235,0.4)]"
          )}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
