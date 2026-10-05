import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt = "Exur: AI Financial Assistant"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Keep this file free of next-intl / app providers — OG routes have no intl context. */
export default async function OpenGraphImage() {
  const logoPng = await readFile(join(process.cwd(), "public/icon-512.png"))
  const logoSrc = `data:image/png;base64,${logoPng.toString("base64")}`

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background:
          "radial-gradient(ellipse at 70% 20%, rgba(37,99,235,0.22) 0%, transparent 55%), linear-gradient(145deg, #0a0a0a 0%, #171717 55%, #0f0f0f 100%)",
        color: "#f5f5f5",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={72}
          height={72}
          style={{ borderRadius: 9999 }}
        />
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Exur
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Your smart financial assistant.
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a3a3a3",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Ask about news and price action. Clear setup — or sit out.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: "#737373",
        }}
      >
        <span>exur.ai</span>
        <span style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Read · Ask · Act
        </span>
      </div>
    </div>,
    { ...size }
  )
}
