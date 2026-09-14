import { cn } from "@/lib/utils"

function ChatGeminiNewChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-[22px] shrink-0", className)}
    >
      <path
        d="M16.8412 1.5048L10.7336 7.6124C10.1528 8.1932 9.74079 8.92092 9.54158 9.71777C9.11683 11.4168 8.34537 12.9273 10.0628 12.5844C10.7877 12.4396 11.6314 12.2154 12.4558 11.8935C13.0564 11.6589 13.5785 11.2676 14.0344 10.8116L20.0912 4.7548C21.0378 3.80822 20.9782 2.25615 19.9618 1.38496C19.0501 0.60346 17.6903 0.65568 16.8412 1.5048Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M9.5 1.5H9C4.30558 1.5 0.5 5.30558 0.5 10C0.5 14.6944 4.30558 18.5 9 18.5H15C19.6944 18.5 23.5 14.6944 23.5 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { ChatGeminiNewChatIcon }
