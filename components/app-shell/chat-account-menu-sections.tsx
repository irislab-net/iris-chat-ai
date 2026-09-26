"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  BookOpenIcon,
  CircleHelpIcon,
  FileTextIcon,
  LogOutIcon,
  MailIcon,
  NewspaperIcon,
  ReceiptIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import { AccountPreferencesGroup } from "@/components/app-shell/chat-account-preferences"
import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/api/types"
import { getPrivacyNoticeHref, getTermsOfServiceHref } from "@/lib/legal"
import {
  BILLING_PATH,
  getMarketingHomePath,
  getMarketingPageHref,
  UPGRADE_PATH,
} from "@/lib/site"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const CONTACT_EMAIL = "hello@exur.ai"

function AccountPlanBadge({
  planName,
  isProUser,
}: {
  planName: string
  isProUser: boolean
}) {
  return (
    <Badge
      variant={isProUser ? "default" : "secondary"}
      className={cn(
        "h-5 shrink-0 px-1.5 text-[10px] font-semibold tracking-wide",
        isProUser && "border-0 bg-foreground text-background"
      )}
    >
      {isProUser ? <SparklesIcon className="size-2.5" aria-hidden /> : null}
      {planName}
    </Badge>
  )
}

function AccountHelpGroup() {
  const t = useTranslations("workspace")
  const faqHref = `${getMarketingPageHref(getMarketingHomePath())}#faq`
  const whatIsHref = getMarketingPageHref("/what-is-exur")
  const termsHref = getTermsOfServiceHref()
  const privacyHref = getPrivacyNoticeHref()

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={cn(chatContextMenuItemClass, "gap-3")}
        >
          <CircleHelpIcon className={chatContextMenuIconClass} />
          <span className="flex-1 text-start">{t("help")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          className={cn(chatContextMenuContentClass, "min-w-48")}
          sideOffset={8}
        >
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={
              <a href={faqHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <CircleHelpIcon className={chatContextMenuIconClass} />
            {t("helpFaq")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={
              <a href={whatIsHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <BookOpenIcon className={chatContextMenuIconClass} />
            {t("helpWhatIsExur")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={
              <a href={termsHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <FileTextIcon className={chatContextMenuIconClass} />
            {t("helpTerms")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={
              <a href={privacyHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ShieldIcon className={chatContextMenuIconClass} />
            {t("helpPrivacy")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MailIcon className={chatContextMenuIconClass} />
            {t("helpContact")}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
}

type AccountSignedInMenuSectionsProps = {
  user: User
  isProUser: boolean
  planName: string
  avatarUrl: string | null
  onLogout: () => void | Promise<void>
  onOpenNews?: () => void
  showHeaderPlanBadge?: boolean
}

function AccountSignedInMenuSections({
  user,
  isProUser,
  planName,
  avatarUrl,
  onLogout,
  onOpenNews,
  showHeaderPlanBadge = true,
}: AccountSignedInMenuSectionsProps) {
  const t = useTranslations("workspace")
  const email = user.email?.trim() || userAccountSubline(user)

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className={chatContextMenuHeaderClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ChatAccountAvatar
                user={user}
                avatarUrl={avatarUrl}
                isProUser={isProUser}
                planName={planName}
                showPlanBadge={false}
                avatarClassName="size-9"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {userAccountLabel(user)}
                </span>
                {email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                ) : null}
              </div>
            </div>
            {showHeaderPlanBadge ? (
              <AccountPlanBadge planName={planName} isProUser={isProUser} />
            ) : null}
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        {!isProUser ? (
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={<Link href={UPGRADE_PATH} />}
          >
            <SparklesIcon className={chatContextMenuIconClass} />
            {t("upgradeToPlus")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className={chatContextMenuItemClass}
          nativeButton={false}
          render={<Link href={BILLING_PATH} />}
        >
          <ReceiptIcon className={chatContextMenuIconClass} />
          {t("billing")}
        </DropdownMenuItem>
        {onOpenNews ? (
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            onClick={onOpenNews}
          >
            <NewspaperIcon className={chatContextMenuIconClass} />
            {t("news")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuGroup>

      <AccountPreferencesGroup />
      <AccountHelpGroup />

      <DropdownMenuItem
        variant="destructive"
        className={chatContextMenuDeleteClass}
        onClick={() => void onLogout()}
      >
        <LogOutIcon className="size-4.5 shrink-0" />
        {t("logOut")}
      </DropdownMenuItem>
    </>
  )
}

function AccountGuestMenuSections({
  loginPending,
  onLogin,
}: {
  loginPending: boolean
  onLogin: () => void
}) {
  const t = useTranslations("workspace")

  return (
    <>
      <AccountPreferencesGroup />
      <AccountHelpGroup />
      <DropdownMenuItem
        className={chatContextMenuItemClass}
        disabled={loginPending}
        onClick={onLogin}
      >
        <GoogleGlyph className="size-4 shrink-0" />
        {loginPending ? t("connecting") : t("signIn")}
      </DropdownMenuItem>
    </>
  )
}

export {
  AccountGuestMenuSections,
  AccountHelpGroup,
  AccountPlanBadge,
  AccountSignedInMenuSections,
}
