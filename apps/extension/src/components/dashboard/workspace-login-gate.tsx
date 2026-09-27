"use client"

import { LogInIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { WORKSPACE_LOGIN_COPY } from "@/lib/workspace-auth"
import type { WorkspacePageId } from "@/lib/workspace-page-info"
import { cn } from "@/lib/utils"

function WorkspaceLoginGate({
  page,
  className,
  compact = false,
}: {
  page: WorkspacePageId
  className?: string
  compact?: boolean
}) {
  const t = useTranslations("workspace")
  const { login, loginPending } = useAuth()
  const copy = WORKSPACE_LOGIN_COPY[page]

  return (
    <Empty
      className={cn(
        "rounded-2xl bg-muted/18",
        compact ? "min-h-48 py-8" : "min-h-56 py-10",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LogInIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.title}</EmptyTitle>
        <EmptyDescription className="max-w-sm text-pretty">
          {copy.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          className={cn(
            "h-11 gap-2 px-5 text-[13px]",
            compact ? "w-auto" : "min-w-52"
          )}
          disabled={loginPending}
          onClick={() => login({ source: "data_access_notice" })}
        >
          <GoogleGlyph className="size-4" />
          {loginPending ? t("connecting") : t("continueWithGoogle")}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export { WorkspaceLoginGate }
