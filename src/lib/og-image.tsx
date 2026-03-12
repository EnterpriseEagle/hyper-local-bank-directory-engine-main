import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

type ThemeName = "blue" | "green" | "red" | "amber";

interface OgStat {
  label: string;
  value: string;
}

interface BrandOgImageInput {
  eyebrow: string;
  title: string;
  subtitle: string;
  brand?: string;
  footer?: string;
  theme?: ThemeName;
  stats?: OgStat[];
}

const THEMES: Record<
  ThemeName,
  {
    line: string;
    glow: string;
    titleAccent: string;
  }
> = {
  blue: {
    line: "linear-gradient(90deg, #3b82f6, #22c55e, #eab308)",
    glow: "radial-gradient(circle, rgba(59,130,246,0.30) 0%, rgba(17,24,39,0.10) 45%, rgba(0,0,0,0) 75%)",
    titleAccent: "rgba(255,255,255,0.45)",
  },
  green: {
    line: "linear-gradient(90deg, #22c55e, #3b82f6, #f8fafc)",
    glow: "radial-gradient(circle, rgba(34,197,94,0.28) 0%, rgba(59,130,246,0.14) 45%, rgba(0,0,0,0) 75%)",
    titleAccent: "rgba(167,243,208,0.85)",
  },
  red: {
    line: "linear-gradient(90deg, #ef4444, #f97316, #f8fafc)",
    glow: "radial-gradient(circle, rgba(239,68,68,0.28) 0%, rgba(124,45,18,0.14) 45%, rgba(0,0,0,0) 75%)",
    titleAccent: "rgba(254,202,202,0.9)",
  },
  amber: {
    line: "linear-gradient(90deg, #f59e0b, #22c55e, #f8fafc)",
    glow: "radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(34,197,94,0.14) 45%, rgba(0,0,0,0) 75%)",
    titleAccent: "rgba(254,243,199,0.92)",
  },
};

export function createBrandOgImage({
  eyebrow,
  title,
  subtitle,
  brand = "BANK NEAR ME",
  footer = "banknearme.com.au",
  theme = "blue",
  stats = [],
}: BrandOgImageInput) {
  const palette = THEMES[theme];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #000000 0%, #05070c 45%, #101827 100%)",
          color: "white",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: palette.glow,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "5px",
            background: palette.line,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {brand}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.34)",
                }}
              >
                {eyebrow}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "920px",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                fontSize: "62px",
                fontWeight: 300,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: "840px",
                marginTop: "22px",
                fontSize: "24px",
                lineHeight: 1.45,
                fontWeight: 300,
                color: palette.titleAccent,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {stats.slice(0, 3).map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "160px",
                    paddingTop: "18px",
                    borderTop: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "32px",
                      fontWeight: 300,
                      color: "white",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.34)",
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.32)",
              }}
            >
              {footer}
            </div>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE
  );
}
