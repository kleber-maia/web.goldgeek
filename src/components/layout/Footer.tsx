import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer
      data-elementor-type="footer"
      data-elementor-id="77"
      className="elementor elementor-77 elementor-location-footer"
      data-elementor-post-type="elementor_library"
    >
      {/* Main footer content */}
      <div
        className="elementor-element elementor-element-1c98797 e-flex e-con-boxed e-con e-parent"
        data-id="1c98797"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          {/* Logo */}
          <div
            className="elementor-element elementor-element-4adeaa2 elementor-widget-mobile__width-inherit elementor-widget elementor-widget-image"
            data-id="4adeaa2"
            data-element_type="widget"
            data-widget_type="image.default"
          >
            <div className="elementor-widget-container">
              <Image
                width={250}
                height={173}
                src="/images/logos/GoldGeekLogo.png"
                className="attachment-large size-large wp-image-79"
                alt="Gold Geek"
              />
            </div>
          </div>

          {/* Policy links */}
          <div
            className="elementor-element elementor-element-0c5e116 elementor-widget elementor-widget-text-editor"
            data-id="0c5e116"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <br />
                <Link href="/terms-conditions">terms and conditions</Link>
              </p>
            </div>
          </div>

          {/* CTA and contact container */}
          <div
            className="elementor-element elementor-element-213e18d e-con-full e-flex e-con e-child"
            data-id="213e18d"
            data-element_type="container"
          >
            {/* CTA Button */}
            <div
              className="elementor-element elementor-element-e759f3a elementor-align-center elementor-widget elementor-widget-button"
              data-id="e759f3a"
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

            {/* Phone number */}
            <div
              className="elementor-element elementor-element-a578151 elementor-align-end elementor-icon-list--layout-traditional elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list"
              data-id="a578151"
              data-element_type="widget"
              data-widget_type="icon-list.default"
            >
              <div className="elementor-widget-container">
                <ul className="elementor-icon-list-items">
                  <li className="elementor-icon-list-item">
                    <span className="elementor-icon-list-icon">
                      <svg
                        aria-hidden="true"
                        className="e-font-icon-svg e-fas-phone-alt"
                        viewBox="0 0 512 512"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path>
                      </svg>
                    </span>
                    <span className="elementor-icon-list-text">
                      (833) 446-5343
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Social icons */}
          <div
            className="elementor-element elementor-element-21fea4c elementor-grid-1 elementor-grid-mobile-2 e-grid-align-mobile-center elementor-shape-rounded e-grid-align-center elementor-widget elementor-widget-social-icons"
            data-id="21fea4c"
            data-element_type="widget"
            data-widget_type="social-icons.default"
          >
            <div className="elementor-widget-container">
              <div
                className="elementor-social-icons-wrapper elementor-grid"
                role="list"
              >
                <span className="elementor-grid-item" role="listitem">
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
        </div>
      </div>

      {/* Copyright bar */}
      <div
        className="elementor-element elementor-element-0368af6 e-flex e-con-boxed e-con e-parent"
        data-id="0368af6"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-0c6ae64 elementor-widget-mobile__width-initial elementor-widget elementor-widget-text-editor"
            data-id="0c6ae64"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p>© Copyright Gold Geek 2026</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
