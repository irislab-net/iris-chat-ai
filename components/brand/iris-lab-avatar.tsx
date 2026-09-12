"use client"

import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  IRIS_LAB_LOGO_DARK_SRC,
  IRIS_LAB_LOGO_LIGHT_SRC,
} from "@/components/brand/iris-lab-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type IrisLabAvatarProps = {
  className?: string
  size?: "sm" | "default" | "lg"
}

function IrisLabAvatar({ className, size = "sm" }: IrisLabAvatarProps) {
  const { resolvedTheme } = useTheme()
  const src =
    resolvedTheme === "dark"
      ? IRIS_LAB_LOGO_DARK_SRC
      : IRIS_LAB_LOGO_LIGHT_SRC

  return (
    <Avatar size={size} className={cn("bg-card", className)}>
      <AvatarImage src={src} alt="IRIS" className="object-contain p-0.5" />
      <AvatarFallback className="text-[8px] font-black tracking-tight">
        IR
      </AvatarFallback>
    </Avatar>
  )
}

export { IrisLabAvatar }
