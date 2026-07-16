"use client";

import Image from "next/image";
import type { PakketProduct } from "@/lib/configurator-engine";

interface ProductKaartProps {
  product: PakketProduct;
  resultaat_id?: string;
}

export function ProductKaart({ product, resultaat_id }: ProductKaartProps) {
  async function handleKlik() {
    // Track de affiliate-klik via onze API
    try {
      await fetch("/api/affiliate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          configurator_result_id: resultaat_id ?? null,
          provider_id: product.provider?.naam ?? null,
        }),
      });
    } catch {
      // Tracking mag nooit de navigatie blokkeren
    }
    window.open(product.affiliate_url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="card-surface rounded-2xl overflow-hidden flex flex-col group hover:border-brand-gold/30 transition-all duration-300">
      {/* Afbeelding */}
      <div className="relative h-48 bg-brand-surface flex items-center justify-center overflow-hidden">
        {product.afbeelding_url ? (
          <Image
            src={product.afbeelding_url}
            alt={product.naam}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-5xl opacity-30">📦</div>
        )}
        {/* Categorie-badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-brand-black/80 text-brand-gold text-xs font-mono backdrop-blur-sm">
          {product.category.naam}
        </span>
      </div>

      {/* Inhoud */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Merk + naam */}
        <div>
          {product.merk && (
            <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-1">
              {product.merk}
            </p>
          )}
          <h3 className="font-display font-semibold text-brand-ivory text-lg leading-tight">
            {product.naam}
          </h3>
        </div>

        {/* Uitleg */}
        {product.uitleg && (
          <p className="text-brand-muted text-sm font-body leading-relaxed flex-1">
            {product.uitleg}
          </p>
        )}

        {/* Prijs + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-border mt-auto">
          <span className="font-mono font-medium text-brand-gold text-xl">
            €{product.prijs.toFixed(2).replace(".", ",")}
          </span>
          <button
            onClick={handleKlik}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg gold-shimmer text-brand-black text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Bekijken
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Provider */}
        {product.provider && (
          <p className="text-brand-muted text-xs font-mono">
            via {product.provider.naam}
          </p>
        )}
      </div>
    </div>
  );
}
