"use client"

import * as React from "react"
import { SquareIcon, Volume2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function BulletReadButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [speaking, setSpeaking] = React.useState(false)
  const generationRef = React.useRef(0)
  const supported = React.useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false
  )

  React.useEffect(() => {
    return () => {
      generationRef.current += 1
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!supported || !text.trim()) return null

  function stop() {
    generationRef.current += 1
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  function toggle() {
    if (speaking) {
      stop()
      return
    }

    const trimmed = text.replace(/\s+/g, " ").trim()
    if (!trimmed) return

    window.speechSynthesis.cancel()
    const generation = generationRef.current + 1
    generationRef.current = generation

    const utterance = new SpeechSynthesisUtterance(trimmed)
    utterance.lang = "en-US"
    utterance.rate = 1
    utterance.onend = () => {
      if (generationRef.current !== generation) return
      setSpeaking(false)
    }
    utterance.onerror = () => {
      if (generationRef.current !== generation) return
      setSpeaking(false)
    }
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        "size-6 rounded-md text-muted-foreground hover:text-foreground",
        speaking && "text-foreground",
        className
      )}
      aria-label={speaking ? "Stop reading bullet" : "Read bullet aloud"}
      aria-pressed={speaking}
      onClick={toggle}
    >
      {speaking ? (
        <SquareIcon className="size-3.5 fill-current" aria-hidden />
      ) : (
        <Volume2Icon className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}

export { BulletReadButton }
