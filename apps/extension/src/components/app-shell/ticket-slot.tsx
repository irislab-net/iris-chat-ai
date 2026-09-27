"use client"

import * as React from "react"
import { createPortal } from "react-dom"

type TicketSlotValue = {
  container: HTMLElement | null
  setContainer: (node: HTMLElement | null) => void
  occupied: boolean
  setOccupied: (value: boolean) => void
}

const TicketSlotContext = React.createContext<TicketSlotValue | null>(null)

function TicketSlotProvider({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  const [occupied, setOccupied] = React.useState(false)
  const value = React.useMemo(
    () => ({ container, setContainer, occupied, setOccupied }),
    [container, occupied]
  )
  return (
    <TicketSlotContext.Provider value={value}>
      {children}
    </TicketSlotContext.Provider>
  )
}

function useTicketSlot() {
  return React.useContext(TicketSlotContext)
}

function TicketSlotOutlet({ className }: { className?: string }) {
  const slot = useTicketSlot()
  const setContainer = slot?.setContainer
  const assign = React.useCallback(
    (node: HTMLDivElement | null) => {
      setContainer?.(node)
    },
    [setContainer]
  )
  if (!slot) return null
  return <div ref={assign} className={className} />
}

function TicketSlotPortal({
  children,
  enabled,
}: {
  children: React.ReactNode
  enabled: boolean
}) {
  const slot = useTicketSlot()
  const container = slot?.container ?? null
  const setOccupied = slot?.setOccupied
  React.useLayoutEffect(() => {
    if (!setOccupied) return
    if (!enabled || !container) {
      setOccupied(false)
      return
    }
    setOccupied(true)
    return () => setOccupied(false)
  }, [enabled, container, setOccupied])

  if (!enabled || !container) return null
  return createPortal(children, container)
}

export { TicketSlotProvider, TicketSlotOutlet, TicketSlotPortal, useTicketSlot }
