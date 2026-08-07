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
 * Productafbeelding met nette fallback. Externe aanbieder-afbeeldingen
 * (soms een gewone WordPress-upload i.p.v. een CDN) laden niet altijd
 * betrouwbaar via Next's image-optimizer — vooral wanneer een pagina
 * tientallen afbeeldingen tegelijk aanvraagt kan de herkomstserver een
 * los verzoek laten mislukken. In plaats van een kapot icoon tonen we
 * dan gewoon de neutrale placeholder, net als wanneer er geen
 * afbeelding_url bekend is.
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
      className={className}
      onError={() => setMislukt(true)}
    />
  );
}
