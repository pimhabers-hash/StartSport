"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductAfbeeldingProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  /** Kleine context (bijv. een 40px avatar) — toont alleen het icoon, geen productnaam eronder. */
  compact?: boolean;
}

/**
 * Placeholder voor wanneer er geen foto beschikbaar is: een rustig
 * fotokader-icoon i.p.v. een willekeurige emoji, met (in de normale
 * grotere kaarten) de productnaam eronder — zodat een ontbrekende foto
 * bewust en verzorgd oogt, niet als een kapotte pagina.
 */
function AfbeeldingPlaceholder({ alt, compact }: { alt: string; compact?: boolean }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-2">
      <svg viewBox="0 0 24 24" fill="none" className={compact ? "w-4 h-4 text-brand-gold/25" : "w-7 h-7 text-brand-gold/25"} aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="text-brand-muted/50 text-[10px] font-body text-center leading-snug line-clamp-2">
          {alt}
        </span>
      )}
    </div>
  );
}

/**
 * Productafbeelding met nette fallback. We laden extern via `unoptimized`
 * (browser haalt de bron rechtstreeks op) i.p.v. via Next's server-side
 * image-optimizer, zodat we niet elke externe afbeelding onnodig via onze
 * eigen server proxyen. Let op: dit lost géén Cloudflare-botbescherming
 * op — sommige aanbieders (bijv. Sportsprofi) draaien achter een
 * JS-challenge die alléén bij een volledige paginanavigatie op te lossen
 * is, nooit bij een los <img>-verzoek (server- óf browser-side). Voor die
 * gevallen blijft de nette placeholder hieronder de realistische uitkomst.
 */
export function ProductAfbeelding({
  src,
  alt,
  sizes,
  className = "object-contain p-3",
  compact = false,
}: ProductAfbeeldingProps) {
  const [mislukt, setMislukt] = useState(false);

  if (!src || mislukt) {
    return <AfbeeldingPlaceholder alt={alt} compact={compact} />;
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
