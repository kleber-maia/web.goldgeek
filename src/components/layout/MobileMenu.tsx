"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the element is mounted before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      document.body.style.overflow = "";
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!isVisible) return null;

  const styles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99998,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      opacity: isAnimating ? 1 : 0,
      transition: "opacity 300ms ease-in-out",
    },
    container: {
      position: "fixed" as const,
      top: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      zIndex: 99999,
      backgroundColor: "#AD7B2A",
      overflowY: "auto" as const,
      display: "flex",
      flexDirection: "column" as const,
      transform: isAnimating ? "translateX(0)" : "translateX(100%)",
      transition: "transform 300ms ease-in-out",
    },
    header: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "20px 25px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "10px",
    },
    closeSvg: {
      width: "28px",
      height: "28px",
      fill: "#D4A855",
    },
    content: {
      padding: "20px 30px",
      flex: 1,
    },
    phoneSection: {
      marginBottom: "30px",
    },
    phoneLabel: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      color: "#E8D5A8",
      fontSize: "14px",
      fontWeight: 400,
      fontFamily: "Poppins, sans-serif",
      letterSpacing: "0.5px",
      marginBottom: "4px",
    },
    phoneSvg: {
      width: "18px",
      height: "18px",
      fill: "#E8D5A8",
    },
    phoneNumber: {
      color: "#E8D5A8",
      fontSize: "18px",
      fontWeight: 500,
      fontFamily: "Poppins, sans-serif",
      textDecoration: "none",
      display: "block",
      paddingLeft: "30px",
    },
    nav: {
      marginBottom: "30px",
    },
    ul: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    li: {
      marginBottom: "8px",
    },
    link: {
      display: "block",
      padding: "10px 0",
      color: "#FFFFFF",
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: 600,
      fontFamily: "Poppins, sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    linkActive: {
      display: "block",
      padding: "10px 0",
      color: "rgba(255, 255, 255, 0.5)",
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: 600,
      fontFamily: "Poppins, sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    ctaButton: {
      display: "inline-block",
      padding: "14px 32px",
      background: ctaHover
        ? "linear-gradient(90deg, #AD7B2A 0%, #FBEF9C 100%)"
        : "linear-gradient(90deg, #FBEF9C 0%, #AD7B2A 120%)",
      color: ctaHover ? "#FFFFFF" : "#2E1F0C",
      borderRadius: "50px",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 500,
      fontFamily: "Poppins, sans-serif",
      textTransform: "uppercase" as const,
      transition: "0.5s",
      marginBottom: "30px",
    },
    social: {
      display: "flex",
      gap: "15px",
      marginTop: "10px",
    },
    socialLink: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    socialSvg: {
      width: "32px",
      height: "32px",
      fill: "#E8D5A8",
    },
  };

  return (
    <>
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
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          {/* Phone section */}
          <div style={styles.phoneSection}>
            <div style={styles.phoneLabel}>
              <svg
                style={styles.phoneSvg}
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z" />
              </svg>
              CALL US TODAY
            </div>
            <a href="tel:+18334465343" style={styles.phoneNumber}>
              (833) 446-5343
            </a>
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
            </ul>
          </nav>

          {/* CTA Button */}
          <Link
            href="/request-appraisal"
            onClick={onClose}
            style={styles.ctaButton}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
          >
            Request Appraisal
          </Link>

          {/* My Account link */}
          <Link
            href="/account/login"
            onClick={onClose}
            style={{
              display: "block",
              padding: "10px 0",
              color: "#FFFFFF",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "20px",
            }}
          >
            My Account
          </Link>

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
    </>
  );
}
