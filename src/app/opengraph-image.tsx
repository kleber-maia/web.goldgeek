import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Site-wide Open Graph / social share image (inherited by all routes).
export const runtime = "nodejs";
export const alt = "Gold Geek – Turn Your Gold Into Cash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Read the co-located logo from disk (Node fetch can't read file:// URLs).
  const logoData = await readFile(join(process.cwd(), "src/app/og-logo.png"));
  const logo = Uint8Array.from(logoData).buffer;

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
          background: "linear-gradient(135deg, #FFFFFF 0%, #FBEF9C 100%)",
          fontFamily: "sans-serif",
          padding: "64px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // @ts-expect-error next/og accepts an ArrayBuffer as the image source
          src={logo}
          alt="Gold Geek"
          width={470}
          height={325}
          style={{ objectFit: "contain", marginBottom: "36px" }}
        />
        <div
          style={{
            display: "flex",
            fontSize: "60px",
            fontWeight: 800,
            color: "#57370D",
            textAlign: "center",
            letterSpacing: "-1px",
          }}
        >
          Turn Your Gold Into Cash
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "20px",
            fontSize: "30px",
            fontWeight: 600,
            color: "#AD7B2A",
            textAlign: "center",
          }}
        >
          Free insured appraisal kit · Fast cash · No obligation
        </div>
      </div>
    ),
    { ...size },
  );
}
