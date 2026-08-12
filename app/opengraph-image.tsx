import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0B0D",
        }}
      >
        <span
          style={{
            fontSize: 130,
            fontWeight: 700,
            color: "#C6A15B",
            fontFamily: "Georgia, serif",
          }}
        >
          StartSport
        </span>
        <span
          style={{
            fontSize: 32,
            color: "#9B9DA3",
            fontFamily: "sans-serif",
            marginTop: 16,
          }}
        >
          Vind jouw perfecte sportuitrusting
        </span>
      </div>
    ),
    { ...size }
  );
}
