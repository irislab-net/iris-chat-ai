import { cn } from "@/lib/utils"

type ChatGeminiNewChatIconProps = {
  className?: string
  strokeWidth?: number
}

function ChatGeminiNewChatIcon({
  className,
  strokeWidth = 2,
}: ChatGeminiNewChatIconProps) {
  return (
    <svg
      viewBox="0 0 25 20"
      fill="none"
      aria-hidden
      className={cn("h-4 w-auto shrink-0", className)}
    >
      <path
        d="M17.3412 1.67277L11.2336 7.78037C10.6528 8.36117 10.2408 9.08889 10.0416 9.88574C9.61683 11.5848 8.84537 13.0953 10.5628 12.7523C11.2877 12.6076 12.1314 12.3834 12.9558 12.0614C13.5564 11.8269 14.0785 11.4355 14.5344 10.9796L20.5912 4.92277C21.5378 3.97619 21.4782 2.42412 20.4618 1.55292C19.5501 0.771428 18.1903 0.823648 17.3412 1.67277Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 1.66797H9.5C4.80558 1.66797 1 5.47355 1 10.168C1 14.8624 4.80558 18.668 9.5 18.668H15.5C20.1944 18.668 24 14.8624 24 10.168"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

export { ChatGeminiNewChatIcon }
