import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1E3A8A 0%, #0F1E4D 100%)",
          color: "white",
          fontSize: 128,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          borderRadius: 32,
        }}
      >
        S
      </div>
    ),
    { width: 192, height: 192 }
  );
}
