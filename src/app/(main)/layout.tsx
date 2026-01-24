"use client";

import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="home wp-singular page-template page-template-elementor_header_footer wp-custom-logo wp-embed-responsive wp-theme-hello-elementor theme-default elementor-default elementor-template-full-width elementor-kit-6">
      <a className="skip-link screen-reader-text" href="#content">
        Skip to content
      </a>
      <Header />
      <main id="content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
