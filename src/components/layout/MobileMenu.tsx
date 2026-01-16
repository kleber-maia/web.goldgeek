"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  navItems,
}: MobileMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
    modal: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
    },
    overlay: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    container: {
      position: "absolute" as const,
      right: 0,
      top: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "360px",
      backgroundColor: "#57370D",
      overflowY: "auto" as const,
    },
    header: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "20px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "10px",
    },
    closeSvg: {
      width: "24px",
      height: "24px",
      fill: "#AD7B2A",
    },
    nav: {
      padding: "0 30px",
    },
    ul: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    li: {
      borderBottom: "1px solid rgba(173, 123, 42, 0.3)",
    },
    link: {
      display: "block",
      padding: "15px 0",
      color: "#FFFFFF",
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: 500,
      fontFamily: "Poppins, sans-serif",
    },
    linkActive: {
      display: "block",
      padding: "15px 0",
      color: "#FBEF9C",
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: 500,
      fontFamily: "Poppins, sans-serif",
    },
    ctaWrapper: {
      padding: "30px",
    },
    ctaButton: {
      display: "block",
      padding: "12px 24px",
      backgroundColor: "#AD7B2A",
      color: "#FFFFFF",
      borderRadius: "5px",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 600,
      fontFamily: "Poppins, sans-serif",
      textAlign: "center" as const,
    },
    contact: {
      padding: "0 30px 30px",
    },
    contactLink: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "#AD7B2A",
      textDecoration: "none",
      fontSize: "16px",
      fontFamily: "Poppins, sans-serif",
    },
    contactSvg: {
      width: "16px",
      height: "16px",
      fill: "#AD7B2A",
    },
    social: {
      padding: "0 30px 30px",
      display: "flex",
      gap: "15px",
    },
    socialLink: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      backgroundColor: "rgba(173, 123, 42, 0.2)",
      borderRadius: "50%",
    },
    socialSvg: {
      width: "20px",
      height: "20px",
      fill: "#AD7B2A",
    },
  };

  return (
    <div style={styles.modal}>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Menu container */}
      <div style={styles.container}>
        {/* Close button */}
        <div style={styles.header}>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              style={styles.closeSvg}
              viewBox="0 0 1000 1000"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z" />
            </svg>
          </button>
        </div>

        {/* Navigation menu */}
        <nav style={styles.nav}>
          <ul style={styles.ul}>
            {navItems.map((item) => (
              <li key={item.href} style={styles.li}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  style={pathname === item.href ? styles.linkActive : styles.link}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={styles.li}>
              <a href="/user/login" onClick={onClose} style={styles.link}>
                My Dashboard
              </a>
            </li>
          </ul>
        </nav>

        {/* CTA Button */}
        <div style={styles.ctaWrapper}>
          <Link href="/request-appraisal" onClick={onClose} style={styles.ctaButton}>
            Request appraisal
          </Link>
        </div>

        {/* Contact info */}
        <div style={styles.contact}>
          <a href="tel:+18334465343" style={styles.contactLink}>
            <svg
              style={styles.contactSvg}
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z" />
            </svg>
            (833) 446-5343
          </a>
        </div>

        {/* Social icons */}
        <div style={styles.social}>
          <a
            href="https://www.instagram.com/goldgeekny"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={styles.socialLink}
          >
            <svg
              style={styles.socialSvg}
              viewBox="0 0 448 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/GoldGeekNY"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            style={styles.socialLink}
          >
            <svg
              style={styles.socialSvg}
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
