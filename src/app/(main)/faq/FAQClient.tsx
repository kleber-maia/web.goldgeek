"use client";

import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQClientProps {
  companyName: string;
  phone: string;
}

function buildFaqItems(companyName: string, phone: string): FAQItem[] {
  return [
  {
    id: "how-do-you-pay",
    question: "How do you pay?",
    answer: (
      <>
        <p>We use three different payment methods and they&apos;re all free of charge:</p>
        <ul>
          <li>PayPal is the fastest method; it pays within 24 hours</li>
          <li>Direct Deposit, which is an ACH payment, takes up to three days</li>
          <li>A {companyName} company check, which is sent via U.S.P.S. First Class Mail, generally arrives in 3 to 7 days</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-fast-can-i-get-paid",
    question: "How fast can I get paid?",
    answer: (
      <p>It depends on the payment method you choose. But in each case, we initiate payment within 24 hours of your acceptance of our offer. Then, depending on the type of payment you&apos;ve chosen, the cash will be in your hands between 24 hours and 7 days from the time of acceptance.</p>
    ),
  },
  {
    id: "why-use-the-geeks",
    question: "Why use the Geeks?",
    answer: (
      <p>At {companyName} we work hard to make sure that you receive the highest payout possible for your stuff. Other gold buyers are just interested in the buy-and-melt option. We prefer to find your precious pieces a new home by identifying a buyer from among our extensive list of clients around the world. Re-purposing and scrapping are our last resorts.</p>
    ),
  },
  {
    id: "what-dont-you-buy",
    question: "What don't you buy?",
    answer: (
      <p>We&apos;ve got good taste and a broad palate, so as long as your pieces have a healthy resale value, we&apos;re interested. Occasionally we come across an item that contains very little resale value—silver- and gold-plated items, quartz (battery) watches, loose gemstones, china, crystal, rocks, and pieces made from something other than precious metal. If you have one of these items and think it may have value, then feel free to contact us for a quote.</p>
    ),
  },
  {
    id: "are-shipments-insured",
    question: "Are shipments insured?",
    answer: (
      <p>All shipments are insured for up to $1,000. However, if you believe your items exceed this value, then please contact us and we can insure your package for the appropriate value.</p>
    ),
  },
  {
    id: "how-do-you-calculate-diamond-jewelry",
    question: "How do you calculate the value of my diamond jewelry?",
    answer: (
      <p>Our evaluation of diamond jewelry is a two-part process. First we consider the total carat weight and quality of the stones themselves and assign a price. Next we weigh the metal and assign a value based on the metal&apos;s market value at that moment. Please note we take a pass on pieces made from metals other than gold, silver, platinum, and palladium.</p>
    ),
  },
  {
    id: "what-about-gemstones",
    question: "What about gemstones?",
    answer: (
      <p>If the gemstones are in good condition, and add value to your piece, we will gladly pay you more.</p>
    ),
  },
  {
    id: "what-if-items-dont-fit",
    question: "What happens if all of my items do not fit in the package?",
    answer: (
      <p>If all of your items do not fit in the package, then please let us know and we&apos;ll either send you a postage-paid label for a larger/heavier package—or we&apos;ll send new packaging that accommodates your stuff.</p>
    ),
  },
  {
    id: "do-you-buy-dental-gold",
    question: "Do you buy dental gold?",
    answer: (
      <p>Yes! On average, the gold content of dental gold is about 66.7 percent.</p>
    ),
  },
  {
    id: "do-you-buy-sterling-silver",
    question: "Do you buy sterling silver flatware and hollowware?",
    answer: (
      <p>Oh, yeah, we do! We buy all sterling silver flatware and hollowware. As with jewelry, if the sterling silver is in good condition or from a desirable manufacturer, then we will pay more than the scrap value of the metal.</p>
    ),
  },
  {
    id: "do-you-pay-more-for-designer",
    question: "Do you pay more for designer jewelry?",
    answer: (
      <p>Hell, yes! We will gladly pay more for designer or luxury jewelry. These items are never scrapped or melted down for their metal content but instead they are always cleaned or repaired and then re-sold.</p>
    ),
  },
  {
    id: "do-you-buy-broken-watches",
    question: "Do you buy broken watches?",
    answer: (
      <p>You bet! If the model is in demand, or if it is a known luxury, vintage, or antique watch, we will definitely purchase it regardless of the condition. Then we&apos;ll find a way to get it repaired—or to re-purpose its parts.</p>
    ),
  },
  {
    id: "do-you-provide-written-appraisals",
    question: `Does ${companyName} provide written appraisals?`,
    answer: (
      <p>Unfortunately, we do not provide written appraisals. Our appraisals are based on the cash value of your property on the market at the moment of the appraisal.</p>
    ),
  },
  {
    id: "how-much-will-i-get-for-my-gold",
    question: "How much will I get for my gold?",
    answer: (
      <p>All the information regarding our pricing can be found on our <strong>What We Pay</strong> page. We update our rates daily based on current market rates. If you are interested in receiving an appraisal, please call us or send us an email.</p>
    ),
  },
  {
    id: "please-explain-spot-price",
    question: "Please explain Spot Price.",
    answer: (
      <p>The spot price is the market price of the underlying precious metal in your piece at the moment it is being appraised. It refers to the rate at which gold, silver, or platinum is trading on a specific day.</p>
    ),
  },
  {
    id: "what-kind-of-products-do-you-accept",
    question: "What kind of products do you accept?",
    answer: (
      <p>We accept any kind of item made from precious metals as well as luxury watches, numismatic coins, and bullion. If you have any questions about your item(s), please contact us.</p>
    ),
  },
  {
    id: "will-you-match-other-offers",
    question: "Will you match other offers?",
    answer: (
      <p>We won&apos;t just match other offers; we will pay you the most. Guaranteed! Whatever the offer you&apos;ve received someplace else, we&apos;ll offer you 5% more. We believe in developing long-term relationships with our customers that leave both parties happy. Please see our terms and conditions for more information on how to qualify for our Best Price Guarantee.</p>
    ),
  },
  {
    id: "how-can-i-be-sure-packaging-is-safe",
    question: "How can I be sure that my pieces will be safe in the packaging that you send?",
    answer: (
      <p>Our FREE appraisal kits are very safe. They have a tamper-proof, heavy-duty plastic bag and a durable bubble mailer to cushion your materials. If you have any concerns, or think you might need additional packaging, please call customer service{phone ? <> at {phone}</> : ''}.</p>
    ),
  },
  {
    id: "how-will-i-know-when-you-received-my-kit",
    question: "How will I know when you've received my appraisal kit?",
    answer: (
      <p>As soon as we receive the appraisal kit containing your pieces, we scan it into our inventory system and send you an email, acknowledging the receipt.</p>
    ),
  },
  {
    id: "can-i-get-my-items-back",
    question: "Can I get my items back if I change my mind?",
    answer: (
      <p>Yes. If you decide you want them back, within 72 hours, we&apos;ll put them in a shipper and send them back to you, free of charge.</p>
    ),
  },
  ];
}

export default function FAQClient({ companyName, phone }: FAQClientProps) {
  const [openAccordion, setOpenAccordion] = useState<string>("how-do-you-pay");
  const faqItems = buildFaqItems(companyName, phone);

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
        data-elementor-id="96"
        className="elementor elementor-96"
        data-elementor-post-type="page"
      >
        {/* Hero Section */}
        <div
          className="elementor-element elementor-element-a2ee8bf e-flex e-con-boxed e-con e-parent e-lazyloaded"
          data-id="a2ee8bf"
          data-element_type="container"
          data-settings='{"background_background":"classic"}'
        >
          <div className="e-con-inner">
            <div
              className="elementor-element elementor-element-66758ac elementor-widget elementor-widget-heading"
              data-id="66758ac"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Frequently Asked Questions
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div
          className="elementor-element elementor-element-ed26be5 e-flex e-con-boxed e-con e-parent"
          data-id="ed26be5"
          data-element_type="container"
        >
          <div className="e-con-inner">
            <div
              className="elementor-element elementor-element-1dbb807 elementor-widget elementor-widget-n-accordion"
              data-id="1dbb807"
              data-element_type="widget"
              data-widget_type="nested-accordion.default"
            >
              <div className="elementor-widget-container">
                <div
                  className="e-n-accordion"
                  aria-label="Accordion. Open links with Enter or Space, close with Escape, and navigate with Arrow Keys"
                >
                  {faqItems.map((item, index) => (
                    <details
                      key={item.id}
                      id={`e-n-accordion-item-${index}`}
                      className="e-n-accordion-item"
                      open={openAccordion === item.id}
                    >
                      <summary
                        className="e-n-accordion-item-title"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleAccordion(item.id);
                        }}
                      >
                        <span className="e-n-accordion-item-title-header">
                          <div className="e-n-accordion-item-title-text">
                            {" "}{item.question}{" "}
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
                        className="elementor-element e-con-full e-flex e-con e-child"
                        data-element_type="container"
                      >
                        <div
                          className="elementor-element elementor-widget elementor-widget-text-editor"
                          data-element_type="widget"
                          data-widget_type="text-editor.default"
                        >
                          <div className="elementor-widget-container">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
