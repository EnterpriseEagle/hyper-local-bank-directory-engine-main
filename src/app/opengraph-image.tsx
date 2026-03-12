import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BANK NEAR ME® - Is Your Bank Actually Working?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111827 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #3b82f6, #ef4444, #f59e0b)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "white",
              textTransform: "uppercase" as const,
            }}
          >
            BANK NEAR ME®
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 300,
            lineHeight: 1.05,
            color: "white",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Is Your Bank</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            Actually Working?
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5,
            maxWidth: "700px",
          }}
        >
          Live crowd-sourced status for 15,000+ Australian suburbs. ATM
          outages, branch closures, and queue reports in real-time.
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
          }}
        >
          {[
            { label: "SUBURBS", value: "15,548" },
            { label: "BRANCHES", value: "4,030" },
            { label: "ATMs", value: "2,965" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 300,
                  color: "white",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "4px",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
