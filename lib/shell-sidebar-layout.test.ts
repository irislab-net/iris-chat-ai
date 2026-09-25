import { describe, expect, it } from "vitest"

import {
  SHELL_SIDEBAR_COMPACT_MAX_WIDTH,
  shellSidebarLayoutForWidth,
} from "@/lib/shell-sidebar-layout"

describe("shellSidebarLayoutForWidth", () => {
  it("uses minimum sidebar defaults on laptop-width viewports", () => {
    const layout = shellSidebarLayoutForWidth(SHELL_SIDEBAR_COMPACT_MAX_WIDTH)

    expect(layout.tier).toBe("compact")
    expect(layout.chat.defaultSize).toBe(layout.chat.minSize)
    expect(layout.ticket.defaultSize).toBe(layout.ticket.minSize)
    expect(layout.contextMinSize).toBe("45%")
    expect(layout.chat.defaultSize).toBe("15rem")
    expect(layout.ticket.defaultSize).toBe("14rem")
  })

  it("uses a slightly wider chat rail on Windows", () => {
    const layout = shellSidebarLayoutForWidth(SHELL_SIDEBAR_COMPACT_MAX_WIDTH, {
      windows: true,
    })

    expect(layout.tier).toBe("compact")
    expect(layout.chat.defaultSize).toBe("16.5rem")
    expect(layout.chat.minSize).toBe("16.5rem")
  })

  it("uses wider defaults on large desktops", () => {
    const layout = shellSidebarLayoutForWidth(
      SHELL_SIDEBAR_COMPACT_MAX_WIDTH + 1
    )

    expect(layout.tier).toBe("comfortable")
    expect(layout.chat.defaultSize).toBe("18rem")
    expect(layout.ticket.defaultSize).toBe("16rem")
  })
})
