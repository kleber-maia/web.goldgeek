"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface ScrollRotatingImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  rotationSpeed?: number;
}

export default function ScrollRotatingImage({
  src,
  alt,
  width,
  height,
  className = "",
  rotationSpeed = 0.2,
}: ScrollRotatingImageProps) {
  const [rotation, setRotation] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;

      if (rect.bottom > 0 && rect.top < viewportHeight) {
        const scrollProgress =
          (viewportHeight - elementCenter) / viewportHeight;
        const newRotation = scrollProgress * 360 * rotationSpeed;
        setRotation(newRotation);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [rotationSpeed]);

  return (
    <div ref={elementRef} className="elementor-widget-container">
      <Image
        width={width}
        height={height}
        src={src}
        className={className}
        alt={alt}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: "transform 0.1s ease-out",
        }}
      />
    </div>
  );
}
