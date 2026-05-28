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
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        S
      </div>
    ),
    { width: 180, height: 180 }
  );
}
