import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SettingsService } from "@/lib/services/settings.service";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const company = await SettingsService.getCompanyInfo();

  return (
    <div className="home wp-singular page-template page-template-elementor_header_footer wp-custom-logo wp-embed-responsive wp-theme-hello-elementor theme-default elementor-default elementor-template-full-width elementor-kit-6">
      <a className="skip-link screen-reader-text" href="#content">
        Skip to content
      </a>
      <Header
        companyName={company.name}
        instagramUrl={company.instagramUrl}
        facebookUrl={company.facebookUrl}
      />
      <main id="content">
        {children}
      </main>
      <Footer
        companyName={company.name}
        phone={company.phone}
        instagramUrl={company.instagramUrl}
        facebookUrl={company.facebookUrl}
      />
    </div>
  );
}
