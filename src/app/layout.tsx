import type { Metadata } from "next";
import { Poppins, Alegreya_Sans } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
        className={`${poppins.variable} ${alegreyaSans.variable} home wp-singular page-template page-template-elementor_header_footer wp-custom-logo wp-embed-responsive wp-theme-hello-elementor theme-default elementor-default elementor-template-full-width elementor-kit-6`}
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        <a className="skip-link screen-reader-text" href="#content">
          Skip to content
        </a>
        <Header />
        <main id="content">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
