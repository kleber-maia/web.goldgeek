import type { Metadata } from "next";
import { Poppins, Alegreya_Sans } from "next/font/google";

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

export const metadata: Metadata = {
  title: "Gold Geek – Turn Your Gold Into Cash",
  description: "Fast, simple, and secure. Turn your gold, jewelry, diamonds, coins, bullion, and watches into cash with Gold Geek.",
  icons: {
    icon: [
      { url: "/images/favicon/cropped-GoldGeekFavicon-32x32.png", sizes: "32x32" },
      { url: "/images/favicon/cropped-GoldGeekFavicon-192x192.png", sizes: "192x192" },
    ],
    apple: "/images/favicon/cropped-GoldGeekFavicon-180x180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body
        className={`${poppins.variable} ${alegreyaSans.variable}`}
        style={{ fontFamily: "var(--font-poppins), sans-serif", margin: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
