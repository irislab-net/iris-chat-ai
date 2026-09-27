"use client"

import { useTheme } from "@wrksz/themes/client/use-theme"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      gap={8}
      offset={14}
      expand={false}
      visibleToasts={3}
      closeButton={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "!w-auto !max-w-none !border-0 !bg-transparent !p-0 !shadow-none",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
