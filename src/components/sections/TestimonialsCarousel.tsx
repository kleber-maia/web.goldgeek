"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const testimonials = [
  {
    text: "The process is soooo simple with the Gold Geeks, fast, friendly and very fair.",
    name: "Mark T.",
  },
  {
    text: "Friendly, efficient, good value and prompt, I recommend to friends.",
    name: "Robert B.",
  },
  {
    text: "Very professional, quick and efficient in assessing the value of jewelry and coins. Will definitely do business with them again.",
    name: "Linda C.",
  },
];

export default function TestimonialsCarousel() {
  return (
    <div
      className="elementor-element elementor-element-36e66d4 elementor-testimonial--skin-default elementor-testimonial--layout-image_inline elementor-testimonial--align-center elementor-arrows-yes elementor-widget elementor-widget-testimonial-carousel"
      data-id="36e66d4"
      data-element_type="widget"
      data-widget_type="testimonial-carousel.default"
    >
      <div className="elementor-widget-container">
        <div className="elementor-swiper">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: ".elementor-swiper-button-next",
              prevEl: ".elementor-swiper-button-prev",
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            speed={500}
            className="elementor-main-swiper swiper"
            role="region"
            aria-roledescription="carousel"
            aria-label="Slides"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide
                key={index}
                role="group"
                aria-roledescription="slide"
              >
                <div className="elementor-testimonial">
                  <div className="elementor-testimonial__content">
                    <div className="elementor-testimonial__text">
                      {testimonial.text}
                    </div>
                  </div>
                  <div className="elementor-testimonial__footer">
                    <cite className="elementor-testimonial__cite">
                      <span className="elementor-testimonial__name">
                        - {testimonial.name}
                      </span>
                    </cite>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation arrows */}
          <div
            className="elementor-swiper-button elementor-swiper-button-prev"
            role="button"
            tabIndex={0}
            aria-label="Previous"
          >
            <svg
              aria-hidden="true"
              className="e-font-icon-svg e-eicon-chevron-left"
              viewBox="0 0 1000 1000"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path>
            </svg>
          </div>
          <div
            className="elementor-swiper-button elementor-swiper-button-next"
            role="button"
            tabIndex={0}
            aria-label="Next"
          >
            <svg
              aria-hidden="true"
              className="e-font-icon-svg e-eicon-chevron-right"
              viewBox="0 0 1000 1000"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
