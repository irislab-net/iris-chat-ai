"use client"

import * as React from "react"

import { ChatAccountFooter } from "@/components/app-shell/chat-account-footer"
import { DeskRailNav } from "@/components/app-shell/desk-rail-nav"
import { ExurLogo } from "@/components/brand/exur-logo"
import { Link } from "@/i18n/navigation"
import { DESK_AI_PATH } from "@/lib/site"
import {
  chatHistoryRailHeaderBarClass,
  chatHistoryRailHeaderWrapClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

/**
 * Desktop left rail for News / Trade / Profile desk tabs
 * (AI tab uses the chat history sidebar instead).
 */
function DeskContextSidebar({ className }: { className?: string }) {
  return (
    <aside
      data-slot="desk-context-sidebar"
      className={cn(
        "hidden h-full w-[17.5rem] shrink-0 flex-col border-e border-border/40 bg-background lg:flex",
        className
      )}
    >
      <div className={chatHistoryRailHeaderWrapClass}>
        <div className={chatHistoryRailHeaderBarClass}>
          <Link
            href={DESK_AI_PATH}
            className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Exur"
          >
            <ExurLogo
              decorative
              variant="gradient"
              size={36}
              className="size-9 shrink-0 overflow-hidden rounded-full"
            />
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2.5 pb-3 pt-2">
        <DeskRailNav />
      </div>

      <div className="shrink-0 border-t border-border/40 p-2.5">
        <ChatAccountFooter />
      </div>
    </aside>
  )
}

export { DeskContextSidebar }
