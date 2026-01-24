import Image from "next/image";
import Link from "next/link";
import TestimonialsCarousel from "@/components/sections/TestimonialsCarousel";
import TradingViewWidget from "@/components/widgets/TradingViewWidget";
import ScrollRotatingImage from "@/components/ui/ScrollRotatingImage";

export default function HomePage() {
  return (
    <div
      data-elementor-type="wp-post"
      data-elementor-id="20"
      className="elementor elementor-20"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-b081b87 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="b081b87"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-f21e8dc elementor-widget elementor-widget-heading"
            data-id="f21e8dc"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Turn your <span style={{ color: "#FBEF9C" }}>gold</span> into{" "}
                <span style={{ color: "#FBEF9C" }}>cash</span>
              </h2>
            </div>
          </div>
          <div
            className="elementor-element elementor-element-5d4a827 elementor-widget elementor-widget-heading"
            data-id="5d4a827"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Fast, Simple and Secure.
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="elementor-element elementor-element-aa64934 e-flex e-con-boxed e-con e-parent"
        data-id="aa64934"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-09497aa elementor-view-default elementor-widget elementor-widget-icon"
            data-id="09497aa"
            data-element_type="widget"
            data-widget_type="icon.default"
          >
            <div className="elementor-widget-container">
              <div className="elementor-icon-wrapper">
                <a className="elementor-icon" href="#how">
                  <svg
                    aria-hidden="true"
                    className="e-font-icon-svg e-fas-angle-down"
                    viewBox="0 0 320 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        className="elementor-element elementor-element-cf246b4 e-flex e-con-boxed e-con e-parent"
        data-id="cf246b4"
        data-element_type="container"
        id="how"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-9e81887 elementor-widget elementor-widget-heading"
            data-id="9e81887"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                How it works
              </h2>
            </div>
          </div>

          {/* Steps container */}
          <div
            className="elementor-element elementor-element-0ce89d8 e-con-full e-flex e-con e-child"
            data-id="0ce89d8"
            data-element_type="container"
          >
            {/* Step 1 */}
            <div
              className="elementor-element elementor-element-5693046 e-con-full e-flex e-con e-child"
              data-id="5693046"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-ff65058 elementor-view-default elementor-widget elementor-widget-icon"
                data-id="ff65058"
                data-element_type="widget"
                data-widget_type="icon.default"
              >
                <div className="elementor-widget-container">
                  <div className="elementor-icon-wrapper">
                    <div className="elementor-icon">
                      <svg
                        aria-hidden="true"
                        className="e-font-icon-svg e-far-gem"
                        viewBox="0 0 576 512"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M464 0H112c-4 0-7.8 2-10 5.4L2 152.6c-2.9 4.4-2.6 10.2.7 14.2l276 340.8c4.8 5.9 13.8 5.9 18.6 0l276-340.8c3.3-4.1 3.6-9.8.7-14.2L474.1 5.4C471.8 2 468.1 0 464 0zm-19.3 48l63.3 96h-68.4l-51.7-96h56.8zm-202.1 0h90.7l51.7 96H191l51.6-96zm-111.3 0h56.8l-51.7 96H68l63.3-96zm-43 144h51.4L208 352 88.3 192zm102.9 0h193.6L288 435.3 191.2 192zM368 352l68.2-160h51.4L368 352z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-ecfa8c8 elementor-widget elementor-widget-heading"
                data-id="ecfa8c8"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    01
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-90b6b59 elementor-widget elementor-widget-heading"
                data-id="90b6b59"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Request your free Appraisal Kit
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-5c82ad5 elementor-widget elementor-widget-text-editor"
                data-id="5c82ad5"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Simply fill out the form or call our toll-free number to
                    request your free Appraisal Kit.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className="elementor-element elementor-element-f4f511c e-con-full e-flex e-con e-child"
              data-id="f4f511c"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-3a2a3f0 elementor-view-default elementor-widget elementor-widget-icon"
                data-id="3a2a3f0"
                data-element_type="widget"
                data-widget_type="icon.default"
              >
                <div className="elementor-widget-container">
                  <div className="elementor-icon-wrapper">
                    <div className="elementor-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="92.683"
                        height="102.312"
                        viewBox="0 0 92.683 102.312"
                      >
                        <g
                          id="Icon_feather-package"
                          data-name="Icon feather-package"
                          transform="translate(1.5 1.5)"
                        >
                          <path
                            id="Path_1"
                            data-name="Path 1"
                            d="M56.088,38.136a4.612,4.612,0,0,1-2.311-.62L12.07,13.464A4.634,4.634,0,1,1,16.7,5.435L58.407,29.486a4.635,4.635,0,0,1-2.319,8.649Z"
                            transform="translate(9.603 3.916)"
                            fill="#ad7b2a"
                          ></path>
                          <path
                            id="Path_2"
                            data-name="Path 2"
                            d="M49.341,103.435a13.922,13.922,0,0,1-6.944-1.859L9.969,83.046l-.018-.01A13.943,13.943,0,0,1,3,71.01V33.933A13.945,13.945,0,0,1,9.951,21.9l.018-.01L42.4,3.362a13.9,13.9,0,0,1,13.889,0l32.428,18.53.018.01a13.943,13.943,0,0,1,6.951,12.026V71.006a13.945,13.945,0,0,1-6.951,12.03l-.018.01-32.428,18.53A13.922,13.922,0,0,1,49.341,103.435ZM14.581,75.007,47.006,93.536l.018.01a4.634,4.634,0,0,0,4.634,0l.018-.01L84.1,75.007A4.647,4.647,0,0,0,86.414,71V33.933a4.646,4.646,0,0,0-2.312-4L51.676,11.4l-.018-.01a4.634,4.634,0,0,0-4.634,0l-.018.01L14.581,29.932a4.647,4.647,0,0,0-2.312,4.006V71.006A4.646,4.646,0,0,0,14.581,75.007Z"
                            transform="translate(-4.5 -3.003)"
                            fill="#ad7b2a"
                          ></path>
                          <path
                            id="Path_3"
                            data-name="Path 3"
                            d="M48.5,41.611a4.631,4.631,0,0,1-2.32-.623L5.719,17.586A4.634,4.634,0,1,1,10.36,9.563L48.5,31.623,86.631,9.563a4.634,4.634,0,1,1,4.641,8.023l-40.456,23.4A4.631,4.631,0,0,1,48.5,41.611Z"
                            transform="translate(-3.654 12.535)"
                            fill="#ad7b2a"
                          ></path>
                          <path
                            id="Path_4"
                            data-name="Path 4"
                            d="M21.134,72.48A4.634,4.634,0,0,1,16.5,67.846V21.134a4.634,4.634,0,0,1,9.268,0V67.846A4.634,4.634,0,0,1,21.134,72.48Z"
                            transform="translate(23.707 28.332)"
                            fill="#ad7b2a"
                          ></path>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-44c9a31 elementor-widget elementor-widget-heading"
                data-id="44c9a31"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    02
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-fa44350 elementor-widget elementor-widget-heading"
                data-id="fa44350"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Ship your items for free
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-9ffbaa4 elementor-widget elementor-widget-text-editor"
                data-id="9ffbaa4"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Use our prepaid FedEx label to ship your items securely and
                    free of charge.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className="elementor-element elementor-element-8fa2a72 e-con-full e-flex e-con e-child"
              data-id="8fa2a72"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-5fd54e1 elementor-view-default elementor-widget elementor-widget-icon"
                data-id="5fd54e1"
                data-element_type="widget"
                data-widget_type="icon.default"
              >
                <div className="elementor-widget-container">
                  <div className="elementor-icon-wrapper">
                    <div className="elementor-icon">
                      <svg
                        aria-hidden="true"
                        className="e-font-icon-svg e-far-money-bill-alt"
                        viewBox="0 0 640 512"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M320 144c-53.02 0-96 50.14-96 112 0 61.85 42.98 112 96 112 53 0 96-50.13 96-112 0-61.86-42.98-112-96-112zm40 168c0 4.42-3.58 8-8 8h-64c-4.42 0-8-3.58-8-8v-16c0-4.42 3.58-8 8-8h16v-55.44l-.47.31a7.992 7.992 0 0 1-11.09-2.22l-8.88-13.31a7.992 7.992 0 0 1 2.22-11.09l15.33-10.22a23.99 23.99 0 0 1 13.31-4.03H328c4.42 0 8 3.58 8 8v88h16c4.42 0 8 3.58 8 8v16zM608 64H32C14.33 64 0 78.33 0 96v320c0 17.67 14.33 32 32 32h576c17.67 0 32-14.33 32-32V96c0-17.67-14.33-32-32-32zm-16 272c-35.35 0-64 28.65-64 64H112c0-35.35-28.65-64-64-64V176c35.35 0 64-28.65 64-64h416c0 35.35 28.65 64 64 64v160z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-8482c4a elementor-widget elementor-widget-heading"
                data-id="8482c4a"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    03
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-49df712 elementor-widget elementor-widget-heading"
                data-id="49df712"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Get paid fast
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-9ae862a elementor-widget elementor-widget-text-editor"
                data-id="9ae862a"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Accept our offer and get paid within 24 hours via PayPal,
                    check, or direct deposit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div
            className="elementor-element elementor-element-1fe231e elementor-align-center elementor-widget elementor-widget-button"
            data-id="1fe231e"
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
                      Click here for an appraisal
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How & What We Pay Section */}
      <div
        className="elementor-element elementor-element-f08ce4d e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="f08ce4d"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-8baa7b3 e-con-full e-flex e-con e-child"
            data-id="8baa7b3"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-466e98f elementor-widget elementor-widget-heading"
              data-id="466e98f"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  How &amp; What We Pay
                </h2>
              </div>
            </div>
            <div
              className="elementor-element elementor-element-bb45fda elementor-widget elementor-widget-text-editor"
              data-id="bb45fda"
              data-element_type="widget"
              data-widget_type="text-editor.default"
            >
              <div className="elementor-widget-container">
                <p>
                  Within 24 hours of your acceptance of our offer, we pay you,
                  in U.S. currency, in one of three ways:
                </p>
              </div>
            </div>
            <div
              className="elementor-element elementor-element-a334fa5 elementor-icon-list--layout-traditional elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list"
              data-id="a334fa5"
              data-element_type="widget"
              data-widget_type="icon-list.default"
            >
              <div className="elementor-widget-container">
                <ul className="elementor-icon-list-items">
                  <li className="elementor-icon-list-item">
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
                  <li className="elementor-icon-list-item">
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
                  <li className="elementor-icon-list-item">
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
          </div>

          {/* TradingView Widget */}
          <div
            className="elementor-element elementor-element-a459114 e-con-full e-flex e-con e-child"
            data-id="a459114"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-62c6038 elementor-widget elementor-widget-html"
              data-id="62c6038"
              data-element_type="widget"
              data-widget_type="html.default"
            >
              <div className="elementor-widget-container">
                <TradingViewWidget />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gold coin image section */}
      <div
        className="elementor-element elementor-element-234f52f e-flex e-con-boxed e-con e-parent"
        data-id="234f52f"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-85ddff1 elementor-widget elementor-widget-image"
            data-id="85ddff1"
            data-element_type="widget"
            data-widget_type="image.default"
          >
            <ScrollRotatingImage
              width={800}
              height={793}
              src="/images/icons/Camada-1.png"
              className="attachment-large size-large wp-image-129"
              alt="Gold coins"
              rotationSpeed={0.2}
            />
          </div>
        </div>
      </div>

      {/* What We Buy Section */}
      <div
        className="elementor-element elementor-element-c0c9859 e-flex e-con-boxed e-con e-parent"
        data-id="c0c9859"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-7c4cc38 elementor-widget elementor-widget-heading"
            data-id="7c4cc38"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                What we buy
              </h2>
            </div>
          </div>

          {/* Product categories */}
          <div
            className="elementor-element elementor-element-0bf8796 e-con-full e-flex e-con e-child"
            data-id="0bf8796"
            data-element_type="container"
          >
            {/* Precious Metals */}
            <div
              className="elementor-element elementor-element-5403e84 e-con-full e-transform e-flex e-con e-child"
              data-id="5403e84"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-8953191 elementor-widget elementor-widget-image"
                data-id="8953191"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={444}
                    height={1024}
                    src="/images/products/a-golden-key-isolated-2023-11-27-05-13-53-utc-444x1024.png"
                    className="attachment-large size-large wp-image-51"
                    alt="Precious Metals"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-3a5bcfa elementor-widget elementor-widget-heading"
                data-id="3a5bcfa"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Precious Metals
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-4e45fad elementor-widget elementor-widget-text-editor"
                data-id="4e45fad"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Gold, silver, and platinum items.</p>
                </div>
              </div>
            </div>

            {/* Jewelry */}
            <div
              className="elementor-element elementor-element-3166a1b e-con-full e-transform e-flex e-con e-child"
              data-id="3166a1b"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-46967fd elementor-widget elementor-widget-image"
                data-id="46967fd"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={887}
                    src="/images/products/rutilated-quarts-and-gold-ring-2023-11-27-04-59-34-utc.png"
                    className="attachment-large size-large wp-image-56"
                    alt="Jewelry"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-d748cd4 elementor-widget elementor-widget-heading"
                data-id="d748cd4"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Jewelry
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-e9d86af elementor-widget elementor-widget-text-editor"
                data-id="e9d86af"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Bracelets, necklaces, earrings, rings, brooches, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Diamonds */}
            <div
              className="elementor-element elementor-element-19961ea e-con-full e-transform e-flex e-con e-child"
              data-id="19961ea"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-44e76df elementor-widget elementor-widget-image"
                data-id="44e76df"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={754}
                    src="/images/products/diamond-drop-square-earrings-2023-11-27-05-15-34-utc.png"
                    className="attachment-large size-large wp-image-53"
                    alt="Diamonds"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-9338981 elementor-widget elementor-widget-heading"
                data-id="9338981"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Diamonds
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-03844d9 elementor-widget elementor-widget-text-editor"
                data-id="03844d9"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Mounted, loose, and certified diamonds.</p>
                </div>
              </div>
            </div>

            {/* Coins */}
            <div
              className="elementor-element elementor-element-8199f8a e-con-full e-transform e-flex e-con e-child"
              data-id="8199f8a"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-28f188f elementor-widget elementor-widget-image"
                data-id="28f188f"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={798}
                    src="/images/icons/Camada-2.png"
                    className="attachment-large size-large wp-image-52"
                    alt="Coins"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-73b16bb elementor-widget elementor-widget-heading"
                data-id="73b16bb"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Coins
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-53fbf41 elementor-widget elementor-widget-text-editor"
                data-id="53fbf41"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Collectable coins, commemorative coins, American Eagles and
                    more.
                  </p>
                </div>
              </div>
            </div>

            {/* Bullion */}
            <div
              className="elementor-element elementor-element-4f470d8 e-con-full e-transform e-flex e-con e-child"
              data-id="4f470d8"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-95a5d80 elementor-widget elementor-widget-image"
                data-id="95a5d80"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={470}
                    height={1024}
                    src="/images/products/gold-bar-isolated-on-white-background-2023-12-13-23-29-55-utc-470x1024.png"
                    className="attachment-large size-large wp-image-54"
                    alt="Bullion"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-14a3d79 elementor-widget elementor-widget-heading"
                data-id="14a3d79"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Bullion
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-da51a2b elementor-widget elementor-widget-text-editor"
                data-id="da51a2b"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Gold and silver bullion, bars, and rounds.</p>
                </div>
              </div>
            </div>

            {/* Watches */}
            <div
              className="elementor-element elementor-element-e9e52e4 e-con-full e-transform e-flex e-con e-child"
              data-id="e9e52e4"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-288915a elementor-widget elementor-widget-image"
                data-id="288915a"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={568}
                    height={1024}
                    src="/images/products/luxury-watch-isolated-on-white-background-2023-11-27-05-35-25-utc-568x1024.png"
                    className="attachment-large size-large wp-image-55"
                    alt="Watches"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-7b29c17 elementor-widget elementor-widget-heading"
                data-id="7b29c17"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Watches
                  </h2>
                </div>
              </div>
              <div
                className="elementor-element elementor-element-8aab23b elementor-widget elementor-widget-text-editor"
                data-id="8aab23b"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Rolex, Breitling, Omega, Tudor, Patek Philippe, Tiffany
                    &amp; Co., and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="elementor-element elementor-element-2218d02 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="2218d02"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-3ad8516 e-con-full e-flex e-con e-child"
            data-id="3ad8516"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-30a03e5 elementor-widget elementor-widget-heading"
              data-id="30a03e5"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Request An Appraisal Today
                </h2>
              </div>
            </div>
            <div
              className="elementor-element elementor-element-4d44cc8 elementor-widget elementor-widget-text-editor"
              data-id="4d44cc8"
              data-element_type="widget"
              data-widget_type="text-editor.default"
            >
              <div className="elementor-widget-container">
                Have your valuables appraised by your
                <b style={{ color: "#FBEF9C" }}> trusted gold experts</b>, with
                over 40 years in the business.
              </div>
            </div>
            <div
              className="elementor-element elementor-element-0ec8b97 elementor-align-left elementor-widget elementor-widget-button"
              data-id="0ec8b97"
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
                        Order an Appraisal Kit
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div
            className="elementor-element elementor-element-3f2a53a e-con-full e-flex e-con e-child"
            data-id="3f2a53a"
            data-element_type="container"
          ></div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div
        className="elementor-element elementor-element-f2f5c7f e-flex e-con-boxed e-con e-parent"
        data-id="f2f5c7f"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-9c5d991 elementor-widget elementor-widget-heading"
            data-id="9c5d991"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                A word from our customers
              </h2>
            </div>
          </div>

          <TestimonialsCarousel />
        </div>
      </div>
    </div>
  );
}
