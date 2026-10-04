"use client"

import * as React from "react"
import {
  GlobeIcon,
  InfoIcon,
  MicIcon,
  MicOffIcon,
  WifiOffIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  chatAppToastCardClass,
  chatAppToastDescriptionClass,
  chatAppToastSheenClass,
  chatAppToastTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

const DEFAULT_DURATION_MS = 4800
const NOTICE_DURATION_MS = 5600

export type AppToastIcon = "mic" | "mic-off" | "globe" | "wifi-off" | "info"

export type AppToastOptions = {
  id?: string | number
  duration?: number
  title: string
  description?: string
  icon?: AppToastIcon
}

const TOAST_ICONS: Record<
  AppToastIcon,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  mic: MicIcon,
  "mic-off": MicOffIcon,
  globe: GlobeIcon,
  "wifi-off": WifiOffIcon,
  info: InfoIcon,
}

function AppToastCard({
  title,
  description,
  icon = "info",
}: {
  title: string
  description?: string
  icon?: AppToastIcon
}) {
  const Icon = TOAST_ICONS[icon]
  const isRecording = icon === "mic"

  return (
    <div className={cn(chatAppToastCardClass, "app-toast-card")}>
      <span aria-hidden className={chatAppToastSheenClass} />
      <div className="relative z-10 flex min-w-0 items-start gap-3">
        {isRecording ? (
          <span className="app-toast-mic-record mt-0.5 size-5 shrink-0">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
        ) : (
          <Icon
            className="mt-0.5 size-5 shrink-0 text-foreground/80"
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={chatAppToastTitleClass}>{title}</p>
          {description ? (
            <p className={chatAppToastDescriptionClass}>{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Site liquid-glass toast — one card, title + body + icon. */
export function showAppToast(options: AppToastOptions): string | number {
  return toast.custom(
    (_id) => (
      <AppToastCard
        title={options.title}
        description={options.description}
        icon={options.icon}
      />
    ),
    {
      id: options.id,
      duration: options.duration ?? DEFAULT_DURATION_MS,
    }
  )
}

export function showAppErrorToast(options: AppToastOptions): string | number {
  return showAppToast({
    ...options,
    duration: options.duration ?? NOTICE_DURATION_MS,
    icon: options.icon ?? "info",
  })
}

export function dismissAppToast(id?: string | number) {
  toast.dismiss(id)
}
