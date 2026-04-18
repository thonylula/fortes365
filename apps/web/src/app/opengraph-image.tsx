import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FORTE 365 — Calistenia periodizada em português";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const BG = "#0b0b0b";
  const OR = "#ff5500";
  const TX = "#f0f0f0";
  const TX2 = "#999";
  const BD = "#2e2e2e";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255,85,0,0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,85,0,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Diagonal accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 6,
            height: "100%",
            background: OR,
          }}
        />

        {/* Top bar: logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "48px 64px 0 64px",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 4,
              color: OR,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            FORT<span style={{ color: TX }}>E</span>
            <span
              style={{
                fontSize: 14,
                color: TX2,
                letterSpacing: 2,
                marginLeft: 8,
                fontWeight: 700,
              }}
            >
              365
            </span>
          </div>
        </div>

        {/* Main block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 64px 0 64px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 6,
              color: OR,
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: 48, height: 2, background: OR }} />
            CALISTENIA PERIODIZADA · PT-BR
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: 2,
              lineHeight: 1,
              color: TX,
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span>UM ANO DE</span>
              <span style={{ color: OR }}>FORÇA</span>
            </div>
            <div style={{ display: "flex" }}>SEM ACADEMIA.</div>
          </div>

          <div
            style={{
              marginTop: 36,
              fontSize: 26,
              color: TX2,
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Doze meses de periodização automática, coach IA em português e
            nutrição adaptada à safra brasileira.
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "40px 64px 48px 64px",
            borderTop: `1px solid ${BD}`,
            marginTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 3,
              color: TX2,
              textTransform: "uppercase",
            }}
          >
            Mês 1 gratuito · Sem cartão
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 3,
              color: OR,
              textTransform: "uppercase",
            }}
          >
            fortes365.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
