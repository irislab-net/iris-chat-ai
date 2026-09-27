import { cn } from "@/lib/utils"

function ChatGeminiMenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-5.5 shrink-0", className)}
    >
      <path
        d="M5.5 9.25h13"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <path
        d="M5.5 14.75h13"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { ChatGeminiMenuIcon }
