import Image from "next/image";
import MotionFxImage from "@/components/ui/MotionFxImage";
import MotionFxContainer from "@/components/ui/MotionFxContainer";

export default function WhoWeArePage() {
  return (
    <div
      data-elementor-type="wp-page"
      data-elementor-id="88"
      className="elementor elementor-88"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-96a4ee1 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="96a4ee1"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-ae30ed0 elementor-widget elementor-widget-heading"
            data-id="ae30ed0"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                who we are
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* One Shining Moment Section */}
      <div
        className="elementor-element elementor-element-c7e7ee3 e-flex e-con-boxed e-con e-parent"
        data-id="c7e7ee3"
        data-element_type="container"
      >
        <div className="e-con-inner">
          {/* Text Column */}
          <MotionFxContainer
            className="elementor-element elementor-element-f42ffa6 e-con-full e-flex e-con e-child"
            dataId="f42ffa6"
            enableTranslateY={true}
            translateYSpeed={4}
            translateYDirection="positive"
          >
            <div
              className="elementor-element elementor-element-14c7479 elementor-widget elementor-widget-heading"
              data-id="14c7479"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  One Shining Moment
                </h2>
              </div>
            </div>

            <div
              className="elementor-element elementor-element-181eb71 elementor-widget elementor-widget-heading"
              data-id="181eb71"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Gold Geek-in-Chief <b>Jonathan Gordon</b> gets a gleam in his
                  eye when he thinks about that day almost 50 years ago in
                  1973...
                </h2>
              </div>
            </div>

            <div
              className="elementor-element elementor-element-26e7d83 elementor-widget elementor-widget-text-editor"
              data-id="26e7d83"
              data-element_type="widget"
              data-widget_type="text-editor.default"
            >
              <div className="elementor-widget-container">
                <p>
                  When, at the age of 16, he was asked by his father—a
                  second-generation gold bug descended from a first-generation
                  international banker and Gold bug from Vienna—to drive to Los
                  Angeles International Airport to retrieve a shipment of United
                  States gold coins arriving back from Switzerland.
                </p>
                <p>
                  With the Double O Seven soundtrack looping in his head, the
                  young Geek did just that. Buzzing with anticipation, he drove
                  to LAX. He arrived. He parked. He hopped out of his silver car
                  with a flourish. Inside the international freight terminal, he
                  accepted the package. Packed inside the secured case were over
                  1,000 United States $20.00 Double Eagles valued at over a
                  quarter of a million dollars.
                </p>
                <p>
                  The teenaged hippie from Beverly Hills was sold—on gold. And
                  it would become both his obsession and his career.
                </p>
                <p>
                  Fifty years after that gold-geek-in-the-making ran that
                  magical errand to LAX, and six decades after he looked through
                  a loupe for the first time at his father&apos;s office in
                  California, Jonathan moved the company to the East Coast
                  where, in 2017, he found it a home in the heart of New
                  York&apos;s Diamond District.
                </p>
                <p>
                  Here, in the midst of the most concentrated population of the
                  world&apos;s savviest experts in precious metals and stones,
                  Gold Geek has expanded its global network of buyers and
                  sellers and enhanced its ability to secure highly lucrative
                  transactions.
                </p>
              </div>
            </div>
          </MotionFxContainer>

          {/* Images Column */}
          <div
            className="elementor-element elementor-element-2d3d200 e-con-full e-flex e-con e-child"
            data-id="2d3d200"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-cefb942 elementor-widget elementor-widget-image"
              data-id="cefb942"
              data-element_type="widget"
              data-widget_type="image.default"
            >
              <MotionFxImage
                src="/images/icons/Camada-0.png"
                alt="Gold coin"
                width={800}
                height={799}
                className="attachment-large size-large wp-image-153"
                enableTranslateY={true}
                translateYSpeed={1}
                translateYDirection="negative"
                enableRotateZ={true}
                rotateZSpeed={0.5}
                disableOnMobile={false}
              />
            </div>

            <div
              className="elementor-element elementor-element-62aa71b elementor-widget elementor-widget-image"
              data-id="62aa71b"
              data-element_type="widget"
              data-widget_type="image.default"
            >
              <MotionFxImage
                src="/images/icons/Camada-1-1.png"
                alt="Gold coin"
                width={800}
                height={800}
                className="attachment-large size-large wp-image-154"
                enableTranslateY={true}
                translateYSpeed={4}
                translateYDirection="positive"
                enableRotateZ={true}
                rotateZSpeed={0.5}
                disableOnMobile={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Harrison Gordon Section */}
      <div
        className="elementor-element elementor-element-b6c8276 e-flex e-con-boxed e-con e-parent"
        data-id="b6c8276"
        data-element_type="container"
      >
        <div className="e-con-inner">
          {/* Rolex Image Column */}
          <div
            className="elementor-element elementor-element-6c9ab01 e-con-full e-flex e-con e-child"
            data-id="6c9ab01"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-06983e0 elementor-widget elementor-widget-image"
              data-id="06983e0"
              data-element_type="widget"
              data-widget_type="image.default"
            >
              <MotionFxImage
                src="/images/products/rolex.png"
                alt="Rolex watch"
                width={471}
                height={978}
                className="attachment-large size-large wp-image-162"
                enableTranslateY={true}
                translateYSpeed={1}
                translateYDirection="negative"
                enableRotateZ={true}
                rotateZSpeed={0.2}
                disableOnMobile={false}
              />
            </div>
          </div>

          {/* Text Column */}
          <MotionFxContainer
            className="elementor-element elementor-element-106fc04 e-con-full e-flex e-con e-child"
            dataId="106fc04"
            enableTranslateY={true}
            translateYSpeed={4}
            translateYDirection="negative"
          >
            <div
              className="elementor-element elementor-element-af9f8e1 elementor-widget elementor-widget-heading"
              data-id="af9f8e1"
              data-element_type="widget"
              data-widget_type="heading.default"
            >
              <div className="elementor-widget-container">
                <h2 className="elementor-heading-title elementor-size-default">
                  Today, the company is co-managed by Jonathan&apos;s son{" "}
                  <b>Harrison Gordon</b>, who, as Gold Geek&apos;s Deputy
                  Geek-in-Chief, represents the fourth generation of the
                  enterprise.
                </h2>
              </div>
            </div>

            <div
              className="elementor-element elementor-element-c85ccb1 elementor-widget elementor-widget-text-editor"
              data-id="c85ccb1"
              data-element_type="widget"
              data-widget_type="text-editor.default"
            >
              <div className="elementor-widget-container">
                <p>
                  It was with the purchase of a 1961 Rolex Explorer, that
                  Harrison really got his geek on, so lustrous, precise, and
                  weighty was this timepiece. When he&apos;s not on the hunt for
                  another hot model among watches, Harrison is spearheading Gold
                  Geek&apos;s entry into the digital world, and using
                  technology—and the business and financial knowledge he
                  acquired at the University of Miami—to refine its e-commerce
                  and other operating procedures.
                </p>
                <p>
                  With its expertise, pedigree, experience, and its strategic
                  location, Gold Geek is able to guarantee the highest prices on
                  the market to sellers looking to cash in on their gold and
                  other precious metals—family heirlooms and antiques, vintage
                  and antique watches as well as particular models in demand,
                  and bullion and coins.
                </p>
                <p>
                  In other words, there really are no companies geekier about
                  gold than Gold Geek. Geek out with us.
                </p>
              </div>
            </div>
          </MotionFxContainer>
        </div>
      </div>
    </div>
  );
}
