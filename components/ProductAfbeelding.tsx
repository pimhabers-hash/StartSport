"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductAfbeeldingProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  fallbackClassName?: string;
  emoji?: string;
}

/**
 * Productafbeelding met nette fallback. We laden extern via `unoptimized`
 * (browser haalt de bron rechtstreeks op) in plaats van via Next's
 * server-side image-optimizer. Reden: sommige aanbieders (bijv. Sportsprofi)
 * draaien achter Cloudflare-botbescherming die het server-side verzoek van
 * de optimizer altijd blokkeert (JS-challenge, geen headless fetch) — met
 * als gevolg dat die producten voor ALLE bezoekers permanent de
 * placeholder toonden, nooit de echte foto. Een gewone browser die de
 * bron rechtstreeks aanvraagt komt daar wel doorheen.
 */
export function ProductAfbeelding({
  src,
  alt,
  sizes,
  className = "object-contain p-3",
  fallbackClassName = "text-3xl opacity-30",
  emoji = "📦",
}: ProductAfbeeldingProps) {
  const [mislukt, setMislukt] = useState(false);

  if (!src || mislukt) {
    return <span className={fallbackClassName}>{emoji}</span>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      className={className}
      onError={() => setMislukt(true)}
    />
  );
}
