import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "What We Pay — Top Prices, Live Gold Rates",
  description:
    "See why sellers choose Gold Geek: competitive payouts tied to live precious-metal prices, fully transparent valuations, and fast payment. Find out what your gold is worth.",
  path: "/what-we-pay",
});

export default function WhatWePayPage() {
  return (
    <div
      data-elementor-type="wp-page"
      data-elementor-id="94"
      className="elementor elementor-94"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-f93c026 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="f93c026"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-289d134 elementor-widget elementor-widget-heading"
            data-id="289d134"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                How &amp; What We Pay
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div
        className="elementor-element elementor-element-dc8e7e1 e-flex e-con-boxed e-con e-parent"
        data-id="dc8e7e1"
        data-element_type="container"
      >
        <div className="e-con-inner">
          {/* Main Heading */}
          <div
            className="elementor-element elementor-element-fec6e6f elementor-widget elementor-widget-heading"
            data-id="fec6e6f"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                The Geeks pay UP{" "}
                <span style={{ color: "#57370D" }}>– and fast!</span>
              </h2>
            </div>
          </div>

          {/* Subheading */}
          <div
            className="elementor-element elementor-element-393fd16 elementor-widget__width-initial elementor-widget elementor-widget-heading"
            data-id="393fd16"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Within 24 hours of your acceptance of our offer, we pay you, in
                U.S. currency, in one of three ways:
              </h2>
            </div>
          </div>

          {/* Payment Methods Icon List */}
          <div
            className="elementor-element elementor-element-94b0782 elementor-icon-list--layout-inline elementor-align-center elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list"
            data-id="94b0782"
            data-element_type="widget"
            data-widget_type="icon-list.default"
          >
            <div className="elementor-widget-container">
              <ul className="elementor-icon-list-items elementor-inline-items">
                <li className="elementor-icon-list-item elementor-inline-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fab-paypal"
                      viewBox="0 0 384 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M111.4 295.9c-3.5 19.2-17.4 108.7-21.5 134-.3 1.8-1 2.5-3 2.5H12.3c-7.6 0-13.1-6.6-12.1-13.9L58.8 46.6c1.5-9.6 10.1-16.9 20-16.9 152.3 0 165.1-3.7 204 11.4 60.1 23.3 65.6 79.5 44 140.3-21.5 62.6-72.5 89.5-140.1 90.3-43.4.7-69.5-7-75.3 24.2zM357.1 152c-1.8-1.3-2.5-1.8-3 1.3-2 11.4-5.1 22.5-8.8 33.6-39.9 113.8-150.5 103.9-204.5 103.9-6.1 0-10.1 3.3-10.9 9.4-22.6 140.4-27.1 169.7-27.1 169.7-1 7.1 3.5 12.9 10.6 12.9h63.5c8.6 0 15.7-6.3 17.4-14.9.7-5.4-1.1 6.1 14.4-91.3 4.6-22 14.3-19.7 29.3-19.7 71 0 126.4-28.8 142.9-112.3 6.5-34.8 4.6-71.4-23.8-92.6z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">PayPal</span>
                </li>
                <li className="elementor-icon-list-item elementor-inline-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-envelope"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">
                    Direct deposit
                  </span>
                </li>
                <li className="elementor-icon-list-item elementor-inline-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-money-check-alt"
                      viewBox="0 0 640 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M608 32H32C14.33 32 0 46.33 0 64v384c0 17.67 14.33 32 32 32h576c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zM176 327.88V344c0 4.42-3.58 8-8 8h-16c-4.42 0-8-3.58-8-8v-16.29c-11.29-.58-22.27-4.52-31.37-11.35-3.9-2.93-4.1-8.77-.57-12.14l11.75-11.21c2.77-2.64 6.89-2.76 10.13-.73 3.87 2.42 8.26 3.72 12.82 3.72h28.11c6.5 0 11.8-5.92 11.8-13.19 0-5.95-3.61-11.19-8.77-12.73l-45-13.5c-18.59-5.58-31.58-23.42-31.58-43.39 0-24.52 19.05-44.44 42.67-45.07V152c0-4.42 3.58-8 8-8h16c4.42 0 8 3.58 8 8v16.29c11.29.58 22.27 4.51 31.37 11.35 3.9 2.93 4.1 8.77.57 12.14l-11.75 11.21c-2.77 2.64-6.89 2.76-10.13.73-3.87-2.43-8.26-3.72-12.82-3.72h-28.11c-6.5 0-11.8 5.92-11.8 13.19 0 5.95 3.61 11.19 8.77 12.73l45 13.5c18.59 5.58 31.58 23.42 31.58 43.39 0 24.53-19.05 44.44-42.67 45.07zM416 312c0 4.42-3.58 8-8 8H296c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h112c4.42 0 8 3.58 8 8v16zm160 0c0 4.42-3.58 8-8 8h-80c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16zm0-96c0 4.42-3.58 8-8 8H296c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h272c4.42 0 8 3.58 8 8v16z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">
                    Company check via First Class U.S. Mail
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Our 90+ percent policy */}
          <div
            className="elementor-element elementor-element-5c71893 elementor-widget elementor-widget-heading"
            data-id="5c71893"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Our 90+ percent policy
              </h2>
            </div>
          </div>

          <div
            className="elementor-element elementor-element-aaa9bda elementor-widget elementor-widget-text-editor"
            data-id="aaa9bda"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p>
                The Geeks pay TOP DOLLAR! We&apos;ve got a reputation to
                protect. If we&apos;re not paying 90 percent of the intrinsic
                value of your jewelry, and 95 percent for gold coins and
                bullion—based on the market price on the day of the
                transaction—we&apos;re not doing our job.
              </p>
              <p>
                This means we&apos;ve been known to pay as much at $25,000 for a
                Rolex and $12,000 for an Omega, based on demand, comparable
                sales, condition, model, style, and maker.
              </p>
            </div>
          </div>

          {/* Match-making section */}
          <div
            className="elementor-element elementor-element-533e686 elementor-widget elementor-widget-heading"
            data-id="533e686"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                We pride ourselves on our match-making
              </h2>
            </div>
          </div>

          <div
            className="elementor-element elementor-element-901d1e3 elementor-widget elementor-widget-text-editor"
            data-id="901d1e3"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p>
                We won&apos;t just match any offer that you receive from another
                online gold-buyer, we will beat it by 5%! If you can submit an
                official offer from that buyer in writing with a signature
                within 5 days of receiving their offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
