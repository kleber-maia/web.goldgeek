"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function WhatWeBuyPage() {
  const [openAccordion, setOpenAccordion] = useState<string>("jewelry");

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? "" : id);
  };

  return (
    <>
      <style jsx global>{`
        /* Accordion animation */
        .e-n-accordion-item > div {
          overflow: hidden;
          transition: max-height 400ms ease-out, opacity 400ms ease-out;
        }

        .e-n-accordion-item:not([open]) > div {
          max-height: 0;
          opacity: 0;
        }

        .e-n-accordion-item[open] > div {
          max-height: 5000px;
          opacity: 1;
        }

        /* Accordion icon toggle */
        .e-n-accordion-item[open] .e-opened {
          display: inline-block;
        }

        .e-n-accordion-item[open] .e-closed {
          display: none;
        }

        .e-n-accordion-item:not([open]) .e-opened {
          display: none;
        }

        .e-n-accordion-item:not([open]) .e-closed {
          display: inline-block;
        }
      `}</style>
      <div
        data-elementor-type="wp-page"
        data-elementor-id="92"
        className="elementor elementor-92"
        data-elementor-post-type="page"
      >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-8e19739 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="8e19739"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-7dd9399 elementor-widget elementor-widget-heading"
            data-id="7dd9399"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                What we buy
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories Grid - Desktop */}
      <div
        className="elementor-element elementor-element-0e1af27 elementor-hidden-mobile e-flex e-con-boxed e-con e-parent"
        data-id="0e1af27"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-4979b8a e-con-full e-flex e-con e-child"
            data-id="4979b8a"
            data-element_type="container"
          >
            {/* Precious Metals Card */}
            <div
              className="elementor-element elementor-element-9add778 e-con-full e-transform e-flex e-con e-child"
              data-id="9add778"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-43b2592 elementor-widget elementor-widget-image"
                data-id="43b2592"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    fetchPriority="high"
                    width={444}
                    height={1024}
                    src="/images/products/a-golden-key-isolated-2023-11-27-05-13-53-utc-444x1024.png"
                    className="attachment-large size-large wp-image-51"
                    alt="Golden key representing precious metals"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-2315d9f elementor-widget elementor-widget-heading"
                data-id="2315d9f"
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
                className="elementor-element elementor-element-423fcc4 elementor-widget elementor-widget-text-editor"
                data-id="423fcc4"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Gold, silver, and platinum items.</p>
                </div>
              </div>
            </div>

            {/* Jewelry Card */}
            <div
              className="elementor-element elementor-element-2d12b69 e-con-full e-transform e-flex e-con e-child"
              data-id="2d12b69"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-01efa4d elementor-widget elementor-widget-image"
                data-id="01efa4d"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={887}
                    src="/images/products/rutilated-quarts-and-gold-ring-2023-11-27-04-59-34-utc-924x1024.png"
                    className="attachment-large size-large wp-image-56"
                    alt="Gold ring with rutilated quartz"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-0584045 elementor-widget elementor-widget-heading"
                data-id="0584045"
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
                className="elementor-element elementor-element-9e3a253 elementor-widget elementor-widget-text-editor"
                data-id="9e3a253"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Bracelets, necklaces, earrings, rings, brooches, and more.</p>
                </div>
              </div>
            </div>

            {/* Diamonds Card */}
            <div
              className="elementor-element elementor-element-a9f4486 e-con-full e-transform e-flex e-con e-child"
              data-id="a9f4486"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-eb907bb elementor-widget elementor-widget-image"
                data-id="eb907bb"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={754}
                    src="/images/products/diamond-drop-square-earrings-2023-11-27-05-15-34-utc-1024x965.png"
                    className="attachment-large size-large wp-image-53"
                    alt="Diamond drop square earrings"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-e4f1c14 elementor-widget elementor-widget-heading"
                data-id="e4f1c14"
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
                className="elementor-element elementor-element-753604f elementor-widget elementor-widget-text-editor"
                data-id="753604f"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Mounted, loose, and certified diamonds.</p>
                </div>
              </div>
            </div>

            {/* Coins Card */}
            <div
              className="elementor-element elementor-element-946e360 e-con-full e-transform e-flex e-con e-child"
              data-id="946e360"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-001b1bc elementor-widget elementor-widget-image"
                data-id="001b1bc"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={800}
                    height={798}
                    src="/images/icons/Camada-2.png"
                    className="attachment-large size-large wp-image-52"
                    alt="Collectible coins"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-c1fc5aa elementor-widget elementor-widget-heading"
                data-id="c1fc5aa"
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
                className="elementor-element elementor-element-8713a48 elementor-widget elementor-widget-text-editor"
                data-id="8713a48"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Collectable coins, commemorative coins, American Eagles and more.</p>
                </div>
              </div>
            </div>

            {/* Bullion Card */}
            <div
              className="elementor-element elementor-element-938d8da e-con-full e-transform e-flex e-con e-child"
              data-id="938d8da"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-0d73d43 elementor-widget elementor-widget-image"
                data-id="0d73d43"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={470}
                    height={1024}
                    src="/images/products/gold-bar-isolated-on-white-background-2023-12-13-23-29-55-utc-470x1024.png"
                    className="attachment-large size-large wp-image-54"
                    alt="Gold bullion bar"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-d4f6729 elementor-widget elementor-widget-heading"
                data-id="d4f6729"
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
                className="elementor-element elementor-element-5d91030 elementor-widget elementor-widget-text-editor"
                data-id="5d91030"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Gold and silver bullion, bars, and rounds.</p>
                </div>
              </div>
            </div>

            {/* Watches Card */}
            <div
              className="elementor-element elementor-element-a9c7b64 e-con-full e-transform e-flex e-con e-child"
              data-id="a9c7b64"
              data-element_type="container"
            >
              <div
                className="elementor-element elementor-element-2b7861b elementor-widget elementor-widget-image"
                data-id="2b7861b"
                data-element_type="widget"
                data-widget_type="image.default"
              >
                <div className="elementor-widget-container">
                  <Image
                    width={568}
                    height={1024}
                    src="/images/products/luxury-watch-isolated-on-white-background-2023-11-27-05-35-25-utc-568x1024.png"
                    className="attachment-large size-large wp-image-55"
                    alt="Luxury watch"
                  />
                </div>
              </div>
              <div
                className="elementor-element elementor-element-4aae9d9 elementor-widget elementor-widget-heading"
                data-id="4aae9d9"
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
                className="elementor-element elementor-element-c3590f4 elementor-widget elementor-widget-text-editor"
                data-id="c3590f4"
                data-element_type="widget"
                data-widget_type="text-editor.default"
              >
                <div className="elementor-widget-container">
                  <p>Rolex, Breitling, Omega, Tudor, Patek Philippe, Tiffany &amp; Co., and more.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gold. Silver. Platinum Section */}
      <div
        className="elementor-element elementor-element-854db50 e-flex e-con-boxed e-con e-parent"
        data-id="854db50"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-be0ef9c elementor-widget elementor-widget-heading"
            data-id="be0ef9c"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Gold. Silver. Platinum. Antique. Vintage. Designer. Estate.{" "}
                <span style={{ color: "#57370D" }}>Your metals are precious to us.</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Section */}
      <div
        className="elementor-element elementor-element-eb10627 e-flex e-con-boxed e-con e-parent"
        data-id="eb10627"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-e939a8f elementor-widget elementor-widget-n-accordion"
            data-id="e939a8f"
            data-element_type="widget"
            data-widget_type="nested-accordion.default"
          >
            <div className="elementor-widget-container">
              <div
                className="e-n-accordion"
                aria-label="Accordion. Open links with Enter or Space, close with Escape, and navigate with Arrow Keys"
              >
                {/* Jewelry Accordion */}
                <details
                  id="e-n-accordion-item-2440"
                  className="e-n-accordion-item"
                  open={openAccordion === "jewelry"}
                >
                  <summary
                    className="e-n-accordion-item-title"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAccordion("jewelry");
                    }}
                  >
                    <span className="e-n-accordion-item-title-header">
                      <div className="e-n-accordion-item-title-text">
                        {" "}
                        <i className="far fa-gem"></i> Jewelry{" "}
                      </div>
                    </span>
                    <span className="e-n-accordion-item-title-icon">
                      <span className="e-opened">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-minus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                      <span className="e-closed">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-plus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                    </span>
                  </summary>
                  <div
                    className="elementor-element elementor-element-686242d e-con-full e-flex e-con e-child"
                    data-id="686242d"
                    data-element_type="container"
                  >
                    <div
                      className="elementor-element elementor-element-9369122 elementor-widget elementor-widget-text-editor"
                      data-id="9369122"
                      data-element_type="widget"
                      data-widget_type="text-editor.default"
                    >
                      <div className="elementor-widget-container">
                        <p>
                          If you&apos;re ready to turn your unused or unwanted jewelry into cash,
                          sell it to Gold Geek today.
                        </p>
                        <p>
                          Gold Geek&apos;s expert appraisal team offers the highest return on all of
                          your jewelry, from broken necklaces to forgotten bracelets—and the
                          earrings who divorced their partners years ago.
                        </p>
                        <p>
                          Broken, scratched, outdated, or just plain out of fashion, condition does
                          not matter. We pay premium prices as long as your valuables are made of
                          genuine gold, silver, or platinum. In other words, the Geeks don&apos;t
                          discriminate between family heirlooms and yesterday&apos;s impulse buy.
                        </p>
                        <p>
                          Gold Geek believes in the power of T.L.C. to give an old keepsake a new
                          life with someone else. We clean and repair your jewelry and sell it just
                          as we bought it whenever possible. Usually, it fetches a higher price. Only
                          rarely do we melt and sell for scrap. This approach sets us apart.
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>
                              Here&apos;s what makes us really Geek OUT—as long as they&apos;re made
                              from PRECIOUS METALS:
                            </strong>
                          </span>
                        </p>
                        <ul>
                          <li>Necklaces</li>
                          <li>Bracelets</li>
                          <li>Rings</li>
                          <li>Pendants</li>
                          <li>Charms</li>
                          <li>Earrings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Watches Accordion */}
                <details
                  id="e-n-accordion-item-2441"
                  className="e-n-accordion-item"
                  open={openAccordion === "watches"}
                >
                  <summary
                    className="e-n-accordion-item-title"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAccordion("watches");
                    }}
                  >
                    <span className="e-n-accordion-item-title-header">
                      <div className="e-n-accordion-item-title-text">
                        {" "}
                        <i className="far fa-clock"></i> Watches{" "}
                      </div>
                    </span>
                    <span className="e-n-accordion-item-title-icon">
                      <span className="e-opened">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-minus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                      <span className="e-closed">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-plus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                    </span>
                  </summary>
                  <div
                    className="elementor-element elementor-element-715734d e-con-full e-flex e-con e-child"
                    data-id="715734d"
                    data-element_type="container"
                  >
                    <div
                      className="elementor-element elementor-element-bdf1832 elementor-widget elementor-widget-text-editor"
                      data-id="bdf1832"
                      data-element_type="widget"
                      data-widget_type="text-editor.default"
                    >
                      <div className="elementor-widget-container">
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Keeping Time</strong>
                          </span>
                        </p>
                        <p>
                          Our interest in premium luxury and mechanical watches never runs out. Gold
                          Geek offers free appraisals with no strings attached and delivers the best
                          prices the market has to offer on authentic timepieces manufactured in
                          gold, platinum, and stainless steel.
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>What the Geeks look at in a watch:</strong>
                          </span>
                        </p>
                        <p>
                          We carefully inspect each watch for function, movement type, material, and
                          engravings against our extensive knowledge base, reference materials, and
                          experience to determine authenticity.
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>What Gold Geek values in a watch:</strong>
                          </span>
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Authenticity</strong>
                          </span>
                          —we check the material, weight, typefaces and engravings, movement, and
                          function against exacting testing standards that will verify pedigree
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Quality</strong>
                          </span>
                          —materials matter! And they can determine a substantial portion of the
                          price. In some cases, a stainless steel watch is more valuable than the
                          same watch in gold or platinum. In either case, our knowledge and rigor
                          will bring you the very best price
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Value</strong>
                          </span>
                          —Gold Geek studies market prices to find out where your watch clocks in and
                          offers you top dollar
                        </p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Coins Accordion */}
                <details
                  id="e-n-accordion-item-2442"
                  className="e-n-accordion-item"
                  open={openAccordion === "coins"}
                >
                  <summary
                    className="e-n-accordion-item-title"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAccordion("coins");
                    }}
                  >
                    <span className="e-n-accordion-item-title-header">
                      <div className="e-n-accordion-item-title-text">
                        {" "}
                        <i className="fas fa-coins"></i> Coins{" "}
                      </div>
                    </span>
                    <span className="e-n-accordion-item-title-icon">
                      <span className="e-opened">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-minus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                      <span className="e-closed">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-plus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                    </span>
                  </summary>
                  <div
                    className="elementor-element elementor-element-f6fc673 e-con-full e-flex e-con e-child"
                    data-id="f6fc673"
                    data-element_type="container"
                  >
                    <div
                      className="elementor-element elementor-element-c82c27d elementor-widget elementor-widget-text-editor"
                      data-id="c82c27d"
                      data-element_type="widget"
                      data-widget_type="text-editor.default"
                    >
                      <div className="elementor-widget-container">
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Spare change. And gold bullion.</strong>
                          </span>
                        </p>
                        <p>
                          If you have it, we want it, as long as it&apos;s made of a precious metal
                          such as gold, silver, platinum, and some palladium—or designated as a
                          collectible.
                        </p>
                        <p>
                          No matter the age or vintage, the Gold Geeks offer the best market price
                          for full collections, accumulations, or individual coins.
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>How we work:</strong>
                          </span>
                        </p>
                        <p>
                          Gold Geek&apos;s 50-plus years of knowledge and experience in buying and
                          selling numismatic coins enables it to offer the highest market price for
                          full collections and individual coins.
                        </p>
                        <p>
                          After completing the thorough appraisal process, we will offer you the
                          highest value we can in order to buy your gold and silver coins and more.
                        </p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Diamonds Accordion */}
                <details
                  id="e-n-accordion-item-2443"
                  className="e-n-accordion-item"
                  open={openAccordion === "diamonds"}
                >
                  <summary
                    className="e-n-accordion-item-title"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAccordion("diamonds");
                    }}
                  >
                    <span className="e-n-accordion-item-title-header">
                      <div className="e-n-accordion-item-title-text">
                        {" "}
                        <i className="far fa-gem"></i> Diamonds{" "}
                      </div>
                    </span>
                    <span className="e-n-accordion-item-title-icon">
                      <span className="e-opened">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-minus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                      <span className="e-closed">
                        <svg
                          aria-hidden="true"
                          className="e-font-icon-svg e-fas-plus"
                          viewBox="0 0 448 512"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                        </svg>
                      </span>
                    </span>
                  </summary>
                  <div
                    className="elementor-element elementor-element-9dba7cb e-con-full e-flex e-con e-child"
                    data-id="9dba7cb"
                    data-element_type="container"
                  >
                    <div
                      className="elementor-element elementor-element-39828d2 elementor-widget elementor-widget-text-editor"
                      data-id="39828d2"
                      data-element_type="widget"
                      data-widget_type="text-editor.default"
                    >
                      <div className="elementor-widget-container">
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>We Do Diamonds</strong>
                          </span>
                        </p>
                        <p>
                          And we do them all: Studs. Tennis Bracelets. Cocktail rings. Infinity
                          bands.
                        </p>
                        <p>
                          Like the cheeky claim Carol Channing made famous some 70 years ago, the
                          value of diamonds endures. Whether loose in a velvet pouch or winking at
                          you from the setting of your grandmother&apos;s engagement ring, these
                          multi-faceted sparklers remain your best friend—and ours. So turn them into
                          cash with Gold Geek today.
                        </p>
                        <p>
                          Gold Geek&apos;s team of diamond experts completes a careful inspection
                          free of charge before making you the best offer possible.
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Our Appraisal Process:</strong>
                          </span>
                        </p>
                        <p>
                          We follow the &quot;Four Cs,&quot; the universally accepted industry
                          standard for unbiased assessment of both quality and value established by
                          the Gemological Institute of America.
                        </p>
                        <p>The four factors that matter most:</p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Carat Weight</strong>
                          </span>
                          —the weight of the diamond as defined by the metric carat: 1 carat = 200
                          milligrams)
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Color Grade</strong>
                          </span>
                          —often described as epitomizing the absence of color, pure diamonds do not
                          show even a hint of hue. They are graded on a scale from D to Z, with D
                          being assigned to a stone that is absolutely colorless. Each letter between
                          D and Z signifies an interval of increasingly perceptible color
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Clarity Grade</strong>
                          </span>
                          —denotes the number of inclusions or blemishes in the diamond. Both the
                          size and position of flaws are taken into consideration when assigning the
                          grade
                        </p>
                        <p>
                          <span style={{ color: "#ad7b2a" }}>
                            <strong>Cut Grade</strong>
                          </span>
                          —the cut grade reflects a diamond&apos;s ability to interact with light
                          rather than, as is often assumed, its finished shape, i.e., round, emerald,
                          princess. The cut grade is considered the most challenging evaluation of
                          the four Cs.
                        </p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* What We Do Not Buy Section */}
      <div
        className="elementor-element elementor-element-9269327 e-flex e-con-boxed e-con e-parent"
        data-id="9269327"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-5e48884 elementor-widget elementor-widget-heading"
            data-id="5e48884"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                What We Do Not Buy
              </h2>
            </div>
          </div>
          <div
            className="elementor-element elementor-element-c97820e elementor-align-center elementor-icon-list--layout-traditional elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list"
            data-id="c97820e"
            data-element_type="widget"
            data-widget_type="icon-list.default"
          >
            <div className="elementor-widget-container">
              <ul className="elementor-icon-list-items">
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Costume Jewelry</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Non-precious Metals</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Gold-plate</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Silver-plate</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Quartz watches</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Loose semi-precious stones</span>
                </li>
                <li className="elementor-icon-list-item">
                  <span className="elementor-icon-list-icon">
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-times"
                      viewBox="0 0 352 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
                    </svg>
                  </span>
                  <span className="elementor-icon-list-text">Coins with no numismatic value</span>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="elementor-element elementor-element-9867b26 elementor-widget elementor-widget-text-editor"
            data-id="9867b26"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <div className="elementor-element elementor-element-28ed9b25 elementor-widget elementor-widget-heading is-mac">
                <div className="elementor-widget-container">
                  <h4 className="elementor-heading-title elementor-size-default">
                    STILL CURIOUS?
                  </h4>
                </div>
              </div>
              <div className="elementor-element elementor-element-970e889 elementor-widget elementor-widget-text-editor is-mac">
                <div className="elementor-widget-container">
                  <p>&nbsp;</p>
                  <p>
                    If you&apos;re not sure about whether or not your item has value, send us an
                    email or give us a call on our toll-free number and Gold Geek will provide you
                    with an estimate of its market price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
