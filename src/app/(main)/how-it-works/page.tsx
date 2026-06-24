import Link from "next/link";
import MotionFxImage from "@/components/ui/MotionFxImage";
import MotionFxContainer from "@/components/ui/MotionFxContainer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How It Works — Free Kit, Insured, Fast Cash",
  description:
    "Selling gold has never been easier. Request a free appraisal kit, ship your items fully insured, and get a fast cash offer — no obligation. Get started in 3 simple steps.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <div
      data-elementor-type="wp-page"
      data-elementor-id="90"
      className="elementor elementor-90"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-61ed156 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="61ed156"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-5ff3b96 elementor-widget elementor-widget-heading"
            data-id="5ff3b96"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                How It Works
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Selling Gold Has Never Been Easier Section */}
      <div
        className="elementor-element elementor-element-7ea52a2 e-flex e-con-boxed e-con e-parent"
        data-id="7ea52a2"
        data-element_type="container"
      >
        <div className="e-con-inner">
          {/* Text Column */}
          <MotionFxContainer
            className="elementor-element elementor-element-50408aa e-con-full e-flex e-con e-child"
            dataId="50408aa"
            enableTranslateY={true}
            translateYSpeed={4}
            translateYDirection="negative"
          >
            <div
              className="elementor-element elementor-element-d01957f elementor-widget elementor-widget-heading"
              data-id="d01957f"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Selling gold has never been easier.
                </h2>
              </div>
            </div>

            <div
              className="elementor-element elementor-element-ed11dd4 elementor-widget elementor-widget-text-editor"
              data-id="ed11dd4"
              data-element_type="widget"
              data-widget_type="text-editor.default"
            >
              <div className="elementor-widget-container">
                <p>
                  You know you&apos;ve got it. That secret drawer where your
                  forgotten jewelry sits in a knot of neglect. Earrings that may
                  not have lost their sparkle but that have long ago lost their
                  partners, broken chains that aren&apos;t worth fixing, and the
                  vintage watch that will require too much effort to repair.
                </p>
                <p>
                  Despite its appearance, this glinting heap possesses an
                  unknown potential for instant cash, like a junkyard piled with
                  vintage cars at the height of their value.
                </p>
              </div>
            </div>

            <div
              className="elementor-element elementor-element-20fb5a8 elementor-widget elementor-widget-heading"
              data-id="20fb5a8"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Fast. Simple. <span style={{ color: "#AD7B2A" }}>Secure.</span>
                </h2>
              </div>
            </div>
          </MotionFxContainer>

          {/* Ring Image Column */}
          <div
            className="elementor-element elementor-element-cf80f17 e-con-full e-flex e-con e-child"
            data-id="cf80f17"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-4dc5369 elementor-widget elementor-widget-image"
              data-id="4dc5369"
              data-element_type="widget"
              data-widget_type="image.default"
            >
              <MotionFxImage
                src="/images/products/rutilated-quarts-and-gold-ring-2023-11-27-04-59-34-utc-924x1024.png"
                alt="Gold ring with rutilated quartz"
                width={800}
                height={887}
                className="attachment-large size-large wp-image-56"
                enableTranslateY={true}
                translateYSpeed={1}
                translateYDirection="negative"
                enableRotateZ={true}
                rotateZSpeed={0.2}
                disableOnMobile={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Three Easy Steps Section */}
      <div
        className="elementor-element elementor-element-9fbb7d6 e-flex e-con-boxed e-con e-parent"
        data-id="9fbb7d6"
        data-element_type="container"
      >
        <div className="e-con-inner">
          {/* Section Title */}
          <div
            className="elementor-element elementor-element-e57ab40 elementor-widget__width-initial elementor-widget elementor-widget-heading"
            data-id="e57ab40"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Three easy steps stand between you and your money.
              </h2>
            </div>
          </div>

          {/* Steps Container */}
          <div
            className="elementor-element elementor-element-fb042f0 e-con-full e-flex e-con e-child"
            data-id="fb042f0"
            data-element_type="container"
          >
            {/* Step One */}
            <MotionFxContainer
              className="elementor-element elementor-element-8f7e68e e-con-full e-flex e-con e-child"
              dataId="8f7e68e"
              enableTranslateY={false}
            >
              <div
                className="elementor-element elementor-element-c8802c1 elementor-view-default elementor-widget elementor-widget-icon"
                data-id="c8802c1"
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
                className="elementor-element elementor-element-2ae714d elementor-widget elementor-widget-heading"
                data-id="2ae714d"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Step One
                  </h2>
                </div>
              </div>

              <div
                className="elementor-element elementor-element-ed2de61 elementor-widget elementor-widget-heading"
                data-id="ed2de61"
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
                className="elementor-element elementor-element-7ce0377 elementor-widget elementor-widget-text-editor"
                data-id="7ce0377"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    Just complete the form on this page or call our toll-free
                    number to request your free Appraisal Kit. The kit will then
                    be sent directly to your home with detailed instructions on
                    how to ship your valuables to us—safely and securely. We are
                    always available to answer questions by phone and by email.
                  </p>
                </div>
              </div>
            </MotionFxContainer>

            {/* Step Two */}
            <MotionFxContainer
              className="elementor-element elementor-element-f451f59 e-con-full e-flex e-con e-child"
              dataId="f451f59"
              enableTranslateY={true}
              translateYSpeed={8}
              translateYDirection="positive"
            >
              <div
                className="elementor-element elementor-element-2bab8ee elementor-view-default elementor-widget elementor-widget-icon"
                data-id="2bab8ee"
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
                className="elementor-element elementor-element-134779b elementor-widget elementor-widget-heading"
                data-id="134779b"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Step two
                  </h2>
                </div>
              </div>

              <div
                className="elementor-element elementor-element-c50cb9d elementor-widget elementor-widget-heading"
                data-id="c50cb9d"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Ship your pieces securely
                  </h2>
                </div>
              </div>

              <div
                className="elementor-element elementor-element-d77e5e0 elementor-widget elementor-widget-text-editor"
                data-id="d77e5e0"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    <strong>What the Appraisal Kit contains:</strong>
                  </p>
                  <ul>
                    <li>Customer Return Card</li>
                    <li>Tamper-proof plastic bag</li>
                    <li>Bubble mailer</li>
                    <li>
                      Envelope featuring a Gold Geek shipping label and pre-paid
                      postage
                    </li>
                  </ul>
                  <p>&nbsp;</p>
                  <p>
                    <strong>How to use it:</strong>
                  </p>
                  <ul>
                    <li>
                      Inside your Appraisal Kit you&apos;ll find a Customer
                      Return Card. On it you should provide an inventory of the
                      items you&apos;d like appraised, along with any
                      information that pertains to them—provenance, vintage,
                      composition, price paid, year of acquisition, etc.
                    </li>
                    <li>
                      Pack your pieces—along with the Customer Return Card—into
                      the tamper-proof plastic bag and seal it.
                    </li>
                    <li>
                      Insert the plastic bag into the bubble mailer and seal it.
                    </li>
                    <li>
                      Then insert the bubble mailer into the envelope featuring
                      the pre-paid insured shipping label.
                    </li>
                    <li>
                      Drop off your package at any United States Post Office.
                    </li>
                  </ul>
                </div>
              </div>
            </MotionFxContainer>

            {/* Step Three */}
            <MotionFxContainer
              className="elementor-element elementor-element-f231d5a e-con-full e-flex e-con e-child"
              dataId="f231d5a"
              enableTranslateY={false}
            >
              <div
                className="elementor-element elementor-element-c56f303 elementor-view-default elementor-widget elementor-widget-icon"
                data-id="c56f303"
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
                className="elementor-element elementor-element-5a2a5b2 elementor-widget elementor-widget-heading"
                data-id="5a2a5b2"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Step three
                  </h2>
                </div>
              </div>

              <div
                className="elementor-element elementor-element-5c80b1b elementor-widget elementor-widget-heading"
                data-id="5c80b1b"
                data-element_type="widget"
                data-widget_type="heading.default"
              >
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Receive your money within 24 hours of accepting our offer
                  </h2>
                </div>
              </div>

              <div
                className="elementor-element elementor-element-651110c elementor-widget elementor-widget-text-editor"
                data-id="651110c"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>
                    <strong>What we do with your Appraisal Kit:</strong>
                  </p>
                  <ul>
                    <li>
                      We will send you a confirmation email as soon as we
                      receive your kit.
                    </li>
                    <li>
                      Then, after we confirm that the inventory matches the
                      items themselves, one of our expert evaluators will
                      calculate the value of your pieces based on the daily spot
                      price, purity, weight, overall quality and condition, and
                      more.
                    </li>
                    <li>
                      After this evaluation, we&apos;ll provide you with a quote
                      by email or phone.
                    </li>
                    <li>
                      Within 24 hours of your acceptance of our offer, we will
                      send you a secure payment in the form of PayPal, direct
                      deposit, or a Gold Geek company check via First Class U.S.
                      Mail
                    </li>
                    <li>
                      If you decline our offer, within 24 hours, we will
                      initiate a shipment of your pieces back to you securely
                      and free of charge.
                    </li>
                  </ul>
                </div>
              </div>
            </MotionFxContainer>
          </div>

          {/* CTA Button */}
          <div
            className="elementor-element elementor-element-f196fa8 elementor-align-center elementor-widget elementor-widget-button"
            data-id="f196fa8"
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
      </div>
    </div>
  );
}
