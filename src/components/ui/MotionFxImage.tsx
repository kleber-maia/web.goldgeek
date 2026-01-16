"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface MotionFxImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  translateYSpeed?: number;
  translateYDirection?: "positive" | "negative";
  rotateZSpeed?: number;
  enableTranslateY?: boolean;
  enableRotateZ?: boolean;
  disableOnMobile?: boolean;
}

export default function MotionFxImage({
  src,
  alt,
  width,
  height,
  className = "",
  translateYSpeed = 1,
  translateYDirection = "positive",
  rotateZSpeed = 0.5,
  enableTranslateY = false,
  enableRotateZ = false,
  disableOnMobile = false,
}: MotionFxImageProps) {
  const [translateY, setTranslateY] = useState(0);
  const [rotation, setRotation] = useState(0);
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
    if (disableOnMobile && isMobile) {
      setTranslateY(0);
      setRotation(0);
      return;
    }

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;

      // Calculate scroll progress (0 to 1) based on element position in viewport
      // 0 = element just entering from bottom, 1 = element just leaving from top
      const scrollProgress = 1 - elementCenter / viewportHeight;

      // Clamp between -0.5 and 0.5 for centered animation
      const normalizedProgress = Math.max(-0.5, Math.min(0.5, scrollProgress - 0.5));

      if (enableTranslateY) {
        const direction = translateYDirection === "negative" ? -1 : 1;
        // Elementor uses speed as a multiplier, with base movement of ~50px
        const newTranslateY = normalizedProgress * 50 * translateYSpeed * direction;
        setTranslateY(newTranslateY);
      }

      if (enableRotateZ) {
        // Elementor rotateZ: speed 0.5 = ~45 degrees total rotation
        const newRotation = normalizedProgress * 90 * rotateZSpeed;
        setRotation(newRotation);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    translateYSpeed,
    translateYDirection,
    rotateZSpeed,
    enableTranslateY,
    enableRotateZ,
    disableOnMobile,
    isMobile,
  ]);

  const transforms: string[] = [];
  if (enableTranslateY && translateY !== 0) transforms.push(`translateY(${translateY}px)`);
  if (enableRotateZ && rotation !== 0) transforms.push(`rotate(${rotation}deg)`);

  return (
    <div
      ref={elementRef}
      className="elementor-widget-container"
      style={{
        "--e-transform-origin-x": "center",
        "--e-transform-origin-y": "center",
      } as React.CSSProperties}
    >
      <Image
        width={width}
        height={height}
        src={src}
        className={className}
        alt={alt}
        style={{
          transform: transforms.length > 0 ? transforms.join(" ") : undefined,
          transition: "transform 1s cubic-bezier(0, 0.33, 0.07, 1.03)",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
