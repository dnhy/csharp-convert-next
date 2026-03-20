import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#ffffff",
          color: "#0f172a",
          padding: "44px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-90px",
            width: "420px",
            height: "420px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, #ecfeff 0%, #ffffff 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-120px",
            width: "460px",
            height: "460px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, #f0fdf4 0%, #ffffff 74%)",
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "28px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 14px 38px rgba(15, 23, 42, 0.08)",
            padding: "48px",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                padding: "10px 16px",
                fontSize: 24,
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "9999px",
                background: "#ffffff",
              }}
            >
              CSharp Convert Next
            </div>
            <div
              style={{
                display: "flex",
                width: "12px",
                height: "12px",
                borderRadius: "9999px",
                background: "#0f172a",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1px" }}>
              SQL 转换器
            </div>
            <div style={{ fontSize: 32, marginTop: 18, color: "#334155", lineHeight: 1.35 }}>
              C# 提取 SQL / 反向生成字符串
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 22,
              color: "#64748b",
            }}
          >
            <div style={{ display: "flex" }}>Extract · Replace · Reverse Generate</div>
            <div style={{ display: "flex", color: "#0f172a", fontWeight: 600 }}>sql-convert</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

