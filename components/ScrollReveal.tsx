"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}

/**
 * Laat children pas fade-in zodra ze het scherm in scrollen, i.p.v.
 * meteen bij page-load — voor secties onder de vouw die anders altijd
 * al "af" op het scherm staan tegen de tijd dat je ernaartoe scrolt.
 * Animeert maar één keer (niet opnieuw bij terug-scrollen).
 */
export function ScrollReveal({ children, delayMs = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setZichtbaar(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${zichtbaar ? "animate-fade-up" : "opacity-0"} ${className}`}
      style={zichtbaar ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
