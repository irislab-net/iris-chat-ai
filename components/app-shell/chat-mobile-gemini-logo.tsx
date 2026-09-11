"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function ChatMobileGeminiLogo({ className }: { className?: string }) {
  const gradientId = React.useId()

  return (
    <div
      className={cn(
        "chat-gemini-logo relative flex size-[4.5rem] items-center justify-center",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="size-full drop-shadow-sm">
        <defs>
          <linearGradient
            id={gradientId}
            x1="8%"
            y1="8%"
            x2="92%"
            y2="92%"
          >
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="22%" stopColor="#fb923c" />
            <stop offset="48%" stopColor="#f472b6" />
            <stop offset="72%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
        <path
          d="M24 3.5 28.8 19.2 44.5 24 28.8 28.8 24 44.5 19.2 28.8 3.5 24 19.2 19.2Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </div>
  )
}

export { ChatMobileGeminiLogo }
