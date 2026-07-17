"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { CategorieOpties, PakketProduct } from "@/lib/configurator-engine";

interface PakketBuilderProps {
  categorieOpties: CategorieOpties[];
}

export function PakketBuilder({ categorieOpties }: PakketBuilderProps) {
  // Standaard: beste match per categorie is geselecteerd
  const [selectie, setSelectie] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    categorieOpties.forEach((c) => {
      if (c.opties[0]) init[c.category.id] = c.opties[0].id;
    });
    return init;
  });

  // Categorieën die de gebruiker bewust heeft uitgevinkt
  const [uitgevinkt, setUitgevinkt] = useState<Set<string>>(new Set());

  function kiesProduct(categoryId: string, productId: string) {
    setSelectie((s) => ({ ...s, [categoryId]: productId }));
    setUitgevinkt((u) => {
      const nieuw = new Set(u);
      nieuw.delete(categoryId);
      return nieuw;
    });
  }

  function toggleCategorie(categoryId: string) {
    setUitgevinkt((u) => {
      const nieuw = new Set(u);
      if (nieuw.has(categoryId)) nieuw.delete(categoryId);
      else nieuw.add(categoryId);
      return nieuw;
    });
  }

  // Bouw de lijst met daadwerkelijk geselecteerde producten (voor overzicht + totaal)
  const geselecteerdeProducten = useMemo(() => {
    const lijst: PakketProduct[] = [];
    categorieOpties.forEach((c) => {
      if (uitgevinkt.has(c.category.id)) return;
      const productId = selectie[c.category.id];
      const product = c.opties.find((p) => p.id === productId);
      if (product) lijst.push(product);
    });
    return lijst;
  }, [selectie, uitgevinkt, categorieOpties]);

  const totaalprijs = geselecteerdeProducten.reduce((sum, p) => sum + p.prijs, 0);

  async function trackKlik(product: PakketProduct) {
    try {
      await fetch("/api/affiliate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
    } catch {
      // tracking mag navigatie nooit blokkeren
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

      {/* Linkerkant: categorie-secties met suggesties */}
      <div className="space-y-10">
        {categorieOpties.map((c) => {
          const actieveId = selectie[c.category.id];
          const isUitgevinkt = uitgevinkt.has(c.category.id);

          return (
            <div key={c.category.id}>
              {/* Sectie-header per categorie */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl text-brand-ivory">{c.category.naam}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted text-xs font-mono">
                    {c.opties.length} optie{c.opties.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => toggleCategorie(c.category.id)}
                  className="text-xs font-mono text-brand-muted hover:text-brand-ivory transition-colors"
                >
                  {isUitgevinkt ? "+ Toch toevoegen" : "− Niet nodig"}
                </button>
              </div>

              {/* Opties in deze categorie */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isUitgevinkt ? "opacity-40 pointer-events-none" : ""}`}>
                {c.opties.map((product) => {
                  const isGeselecteerd = actieveId === product.id && !isUitgevinkt;
                  const isBesteMatch = product.id === c.opties[0].id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => kiesProduct(c.category.id, product.id)}
                      className={`text-left rounded-2xl overflow-hidden border transition-all duration-200 ${
                        isGeselecteerd
                          ? "border-brand-gold bg-brand-gold/5 shadow-lg shadow-brand-gold/10"
                          : "border-brand-border bg-brand-card hover:border-brand-gold/30"
                      }`}
                    >
                      {/* Afbeelding */}
                      <div className="relative h-32 bg-brand-surface flex items-center justify-center">
                        {product.afbeelding_url ? (
                          <Image src={product.afbeelding_url} alt={product.naam} fill className="object-contain p-3" />
                        ) : (
                          <span className="text-3xl opacity-30">📦</span>
                        )}
                        {isBesteMatch && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-gold text-brand-black text-[10px] font-mono font-medium">
                            BESTE MATCH
                          </span>
                        )}
                        {isGeselecteerd && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center">
                            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                              <path d="M2 6.5L4.5 9L10 3" stroke="#0A0B0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        {product.merk && (
                          <p className="text-brand-muted text-[10px] font-mono uppercase tracking-widest mb-0.5">{product.merk}</p>
                        )}
                        <p className="text-brand-ivory text-sm font-body leading-snug mb-2 line-clamp-2">{product.naam}</p>
                        <p className="font-mono text-brand-gold text-base">
                          €{product.prijs.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rechterkant: sticky pakket-overzicht */}
      <div className="lg:sticky lg:top-24">
        <div className="card-surface rounded-2xl p-6">
          <h3 className="font-display text-lg text-brand-ivory mb-1">Jouw pakket</h3>
          <p className="text-brand-muted text-xs font-mono mb-5">
            {geselecteerdeProducten.length} item{geselecteerdeProducten.length !== 1 ? "s" : ""} geselecteerd
          </p>

          {/* Regels per gekozen product */}
          <div className="space-y-3 mb-5 max-h-[420px] overflow-y-auto pr-1">
            {geselecteerdeProducten.length === 0 && (
              <p className="text-brand-muted text-sm font-body">
                Nog niets geselecteerd — kies producten aan de linkerkant.
              </p>
            )}
            {geselecteerdeProducten.map((product) => (
              <div key={product.id} className="flex items-center gap-3 pb-3 border-b border-brand-border/50 last:border-0">
                <div className="w-10 h-10 rounded-lg bg-brand-surface flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                  {product.afbeelding_url ? (
                    <Image src={product.afbeelding_url} alt={product.naam} fill className="object-contain p-1" />
                  ) : (
                    <span className="text-sm opacity-30">📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-brand-muted text-[10px] font-mono uppercase tracking-wide">{product.category.naam}</p>
                  <p className="text-brand-ivory text-xs font-body truncate">{product.naam}</p>
                </div>
                <span className="font-mono text-brand-gold text-sm flex-shrink-0">
                  €{product.prijs.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
          </div>

          {/* Totaal */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-border mb-5">
            <span className="text-brand-ivory font-body text-sm">Totaal</span>
            <span className="font-mono text-brand-gold text-2xl font-medium">
              €{totaalprijs.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Losse affiliate-knoppen per product */}
          <div className="space-y-2">
            {geselecteerdeProducten.map((product) => (
              <a
                key={product.id}
                href={product.affiliate_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackKlik(product)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-brand-border hover:border-brand-gold/40 transition-colors group"
              >
                <span className="text-brand-muted text-xs font-body truncate group-hover:text-brand-ivory transition-colors">
                  {product.category.naam} bekijken
                </span>
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-brand-gold flex-shrink-0">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
