"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

interface MotionFxContainerProps {
  children: ReactNode;
  className?: string;
  dataId?: string;
  translateYSpeed?: number;
  translateYDirection?: "positive" | "negative";
  enableTranslateY?: boolean;
  disableOnMobile?: boolean;
}

export default function MotionFxContainer({
  children,
  className = "",
  dataId,
  translateYSpeed = 4,
  translateYDirection = "positive",
  enableTranslateY = false,
  disableOnMobile = true,
}: MotionFxContainerProps) {
  const [translateY, setTranslateY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!enableTranslateY || (disableOnMobile && isMobile)) {
      setTranslateY(0);
      return;
    }

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;

      const scrollProgress = 1 - elementCenter / viewportHeight;
      const normalizedProgress = Math.max(-0.5, Math.min(0.5, scrollProgress - 0.5));

      const direction = translateYDirection === "negative" ? -1 : 1;
      const newTranslateY = normalizedProgress * 50 * translateYSpeed * direction;
      setTranslateY(newTranslateY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [translateYSpeed, translateYDirection, enableTranslateY, disableOnMobile, isMobile]);

  return (
    <div
      ref={elementRef}
      className={className}
      data-id={dataId}
      data-element_type="container"
      style={
        enableTranslateY && translateY !== 0
          ? {
              transform: `translateY(${translateY}px)`,
              transition: "transform 1s cubic-bezier(0, 0.33, 0.07, 1.03)",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
