import type { Metadata, Viewport } from "next";
import { Poppins, Alegreya_Sans } from "next/font/google";
import { siteUrl, ogImage } from "@/lib/seo";
import "@/styles/account/account.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const SITE_DESCRIPTION =
  "Get top dollar for your gold, jewelry, diamonds, coins & watches. Free insured appraisal kit, fast cash offers, no obligation. Turn your valuables into cash today!";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gold Geek – Turn Your Gold Into Cash",
    template: "%s | Gold Geek",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Gold Geek",
  robots: { index: true, follow: true },
  // Set GOOGLE_SITE_VERIFICATION in the environment to emit the
  // <meta name="google-site-verification"> tag for Search Console.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  icons: {
    icon: [
      { url: "/images/favicon/cropped-GoldGeekFavicon-32x32.png", sizes: "32x32" },
      { url: "/images/favicon/cropped-GoldGeekFavicon-192x192.png", sizes: "192x192" },
    ],
    apple: "/images/favicon/cropped-GoldGeekFavicon-180x180.png",
  },
  openGraph: {
    type: "website",
    siteName: "Gold Geek",
    locale: "en_US",
    url: siteUrl,
    title: "Gold Geek – Turn Your Gold Into Cash",
    description: SITE_DESCRIPTION,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gold Geek – Turn Your Gold Into Cash",
    description: SITE_DESCRIPTION,
    images: [ogImage.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" style={{ WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" }}>
      <body
        className={`${poppins.variable} ${alegreyaSans.variable}`}
        style={{ fontFamily: "var(--font-poppins), sans-serif", margin: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
