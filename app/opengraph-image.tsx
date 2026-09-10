import { ImageResponse } from "next/og"

export const alt = "IRIS Lab — AI Trading Signals & Crypto Market Co-Pilot"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #141414 0%, #252525 55%, #1a1a1a 100%)",
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
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              border: "3px solid #c8c8c8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#d4d4d4",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            IRIS Lab
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            AI trading signals & co-pilot
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a3a3a3",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Crypto market intelligence and IRIS guidance in one desk.
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
          <span>intel.irislab.info</span>
          <span style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
            ETH · News · Co-pilot
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
