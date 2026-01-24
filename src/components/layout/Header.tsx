"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/who-we-are", label: "Who We Are" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/what-we-buy", label: "What We Buy" },
  { href: "/what-we-pay", label: "What We Pay" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        data-elementor-type="header"
        data-elementor-id="13"
        className="elementor elementor-13 elementor-location-header"
        data-elementor-post-type="elementor_library"
      >
        <div
          className="elementor-element elementor-element-4d22bfb e-flex e-con-boxed e-con e-parent"
          data-id="4d22bfb"
          data-element_type="container"
        >
          <div className="e-con-inner">
            {/* Logo */}
            <div
              className="elementor-element elementor-element-a7e23e6 elementor-widget elementor-widget-theme-site-logo elementor-widget-image"
              data-id="a7e23e6"
              data-element_type="widget"
              data-widget_type="theme-site-logo.default"
            >
              <div className="elementor-widget-container">
                <Link href="/">
                  <Image
                    width={354}
                    height={97}
                    src="/images/logos/GoldGeekLogo-horizontal.png"
                    className="attachment-full size-full wp-image-15"
                    alt="Gold Geek"
                    priority
                  />
                </Link>
              </div>
            </div>

            {/* Right side container */}
            <div
              className="elementor-element elementor-element-3e8547e e-con-full e-flex e-con e-child"
              data-id="3e8547e"
              data-element_type="container"
            >
              {/* My Account link - desktop only */}
              <div
                className="elementor-element elementor-element-053cbfe elementor-icon-list--layout-inline elementor-align-end elementor-hidden-tablet elementor-hidden-mobile elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list"
                data-id="053cbfe"
                data-element_type="widget"
                data-widget_type="icon-list.default"
              >
                <div className="elementor-widget-container">
                  <ul className="elementor-icon-list-items elementor-inline-items">
                    <li className="elementor-icon-list-item elementor-inline-item">
                      <Link href="/user/login" className="elementor-icon-list-text" style={{ textDecoration: "none", marginRight: "15px" }}>
                        My Account
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Social icons - desktop only */}
              <div
                className="elementor-element elementor-element-1e06e2a e-grid-align-right elementor-hidden-tablet elementor-hidden-mobile elementor-shape-rounded elementor-grid-0 elementor-widget elementor-widget-social-icons"
                data-id="1e06e2a"
                data-element_type="widget"
                data-widget_type="social-icons.default"
              >
                <div className="elementor-widget-container">
                  <div
                    className="elementor-social-icons-wrapper elementor-grid"
                    role="list"
                  >
                    <span className="elementor-grid-item" role="listitem" style={{ marginRight: "10px" }}>
                      <a
                        className="elementor-icon elementor-social-icon elementor-social-icon-instagram elementor-repeater-item-9499d4b"
                        href="https://www.instagram.com/goldgeekny"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="elementor-screen-only">Instagram</span>
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fab-instagram"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                        </svg>
                      </a>
                    </span>
                    <span className="elementor-grid-item" role="listitem">
                      <a
                        className="elementor-icon elementor-social-icon elementor-social-icon-facebook elementor-repeater-item-e858db1"
                        href="https://www.facebook.com/GoldGeekNY"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="elementor-screen-only">Facebook</span>
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fab-facebook"
                          viewBox="0 0 512 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
                        </svg>
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation container */}
              <div
                className="elementor-element elementor-element-5c2805b e-con-full e-flex e-con e-child"
                data-id="5c2805b"
                data-element_type="container"
              >
                {/* Desktop Navigation */}
                <div
                  className="elementor-element elementor-element-74a8035 elementor-nav-menu__align-end elementor-nav-menu--stretch elementor-hidden-tablet elementor-hidden-mobile elementor-nav-menu--dropdown-tablet elementor-nav-menu__text-align-aside elementor-nav-menu--toggle elementor-nav-menu--burger elementor-widget elementor-widget-nav-menu"
                  data-id="74a8035"
                  data-element_type="widget"
                  data-widget_type="nav-menu.default"
                >
                  <div className="elementor-widget-container">
                    <nav
                      aria-label="Menu"
                      className="elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-horizontal e--pointer-text e--animation-float"
                    >
                      <ul
                        id="menu-1-74a8035"
                        className="elementor-nav-menu"
                      >
                        {navItems.map((item) => (
                          <li
                            key={item.href}
                            className={`menu-item menu-item-type-post_type menu-item-object-page ${
                              pathname === item.href
                                ? "current-menu-item page_item current_page_item"
                                : ""
                            }`}
                          >
                            <Link
                              href={item.href}
                              className={`elementor-item ${
                                pathname === item.href
                                  ? "elementor-item-active"
                                  : ""
                              }`}
                              aria-current={
                                pathname === item.href ? "page" : undefined
                              }
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </div>

                {/* CTA Button - desktop only */}
                <div
                  className="elementor-element elementor-element-0fbbc2b elementor-align-center elementor-hidden-tablet elementor-hidden-mobile elementor-widget elementor-widget-button"
                  data-id="0fbbc2b"
                  data-element_type="widget"
                  data-widget_type="button.default"
                >
                  <div className="elementor-widget-container">
                    <div className="elementor-button-wrapper">
                      <Link
                        className="elementor-button elementor-button-link elementor-size-sm"
                        href="/request-appraisal"
                      >
                        <span className="elementor-button-content-wrapper">
                          <span className="elementor-button-text">
                            Request appraisal
                          </span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile hamburger menu icon */}
              <div
                className="elementor-element elementor-element-b371262 elementor-hidden-desktop elementor-view-default elementor-widget elementor-widget-icon"
                data-id="b371262"
                data-element_type="widget"
                data-widget_type="icon.default"
              >
                <div className="elementor-widget-container">
                  <div className="elementor-icon-wrapper">
                    <button
                      className="elementor-icon"
                      onClick={() => setMobileMenuOpen(true)}
                      aria-label="Open menu"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        className="e-font-icon-svg e-fas-bars"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
      />
    </>
  );
}
