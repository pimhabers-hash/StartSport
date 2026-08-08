"use client";

import { useState, useMemo } from "react";
import { ProductAfbeelding } from "@/components/ProductAfbeelding";
import { MEERVOUDIGE_CATEGORIEEN, type CategorieOpties, type PakketProduct } from "@/lib/configurator-engine";

interface PakketBuilderProps {
  categorieOpties: CategorieOpties[];
}

export function PakketBuilder({ categorieOpties }: PakketBuilderProps) {
  // Eén datastructuur voor beide gedragingen: per categorie een set
  // geselecteerde product-id's. Bij "kies er één"-categorieën
  // (racket/schoenen/kleding/ballen/tassen/bescherming) zit hier
  // hoogstens 1 id in en wordt bij een nieuwe keuze de vorige vervangen
  // (radio-gedrag) — vooraf al gevuld met de beste match, want daar
  // koopt een klant toch echt maar één van. Bij meervoudige categorieën
  // (accessoires/voeding/vitaminen) begint de set LEEG: een klant kan
  // net zo goed geen enkel of juist meerdere accessoires willen, dus
  // die mogen niet automatisch één voorgeselecteerd krijgen.
  const [selectie, setSelectie] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    categorieOpties.forEach((c) => {
      const isMeervoudig = MEERVOUDIGE_CATEGORIEEN.includes(c.category.slug);
      init[c.category.id] = isMeervoudig || !c.opties[0] ? new Set() : new Set([c.opties[0].id]);
    });
    return init;
  });

  const [uitgevinkt, setUitgevinkt] = useState<Set<string>>(new Set());

  function kiesProduct(categoryId: string, productId: string, isMeervoudig: boolean) {
    setSelectie((s) => {
      const huidig = s[categoryId] ?? new Set<string>();
      let nieuweSet: Set<string>;
      if (isMeervoudig) {
        nieuweSet = new Set(huidig);
        if (nieuweSet.has(productId)) nieuweSet.delete(productId);
        else nieuweSet.add(productId);
      } else {
        nieuweSet = new Set([productId]);
      }
      return { ...s, [categoryId]: nieuweSet };
    });
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

  const geselecteerdeProducten = useMemo(() => {
    const lijst: PakketProduct[] = [];
    categorieOpties.forEach((c) => {
      if (uitgevinkt.has(c.category.id)) return;
      const ids = selectie[c.category.id];
      if (!ids) return;
      c.opties.forEach((p) => {
        if (ids.has(p.id)) lijst.push(p);
      });
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
      <div className="space-y-10 min-w-0">
        {categorieOpties.map((c, i) => {
          const isMeervoudig = MEERVOUDIGE_CATEGORIEEN.includes(c.category.slug);
          const actieveIds = selectie[c.category.id] ?? new Set<string>();
          const isUitgevinkt = uitgevinkt.has(c.category.id);

          return (
            <div key={c.category.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              {/* Sectie-header per categorie — wrapt netjes op smalle schermen */}
              <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h3 className="font-display text-xl text-brand-ivory truncate">{c.category.naam}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted text-xs font-mono flex-shrink-0">
                    {c.opties.length} optie{c.opties.length !== 1 ? "s" : ""}
                  </span>
                  {isMeervoudig && actieveIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-mono flex-shrink-0">
                      {actieveIds.size} gekozen
                    </span>
                  )}
                </div>
                {!isMeervoudig && (
                  <button
                    onClick={() => toggleCategorie(c.category.id)}
                    className="text-xs font-mono text-brand-muted hover:text-brand-ivory transition-colors flex-shrink-0"
                  >
                    {isUitgevinkt ? "+ Toch toevoegen" : "− Niet nodig"}
                  </button>
                )}
              </div>

              {/* Meervoudige categorieën (accessoires/voeding/vitaminen): niets
                  staat vooraf aan — een klant kan er meerdere willen, of geen
                  enkele, dus dat leggen we niet voor hem vast. */}
              {isMeervoudig && (
                <p className="text-brand-muted text-xs font-body mb-4">
                  Kies er zoveel als je wilt, of sla deze categorie over.
                </p>
              )}

              {/* Opties in deze categorie */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isUitgevinkt ? "opacity-40 pointer-events-none" : ""}`}>
                {c.opties.map((product) => {
                  const isGeselecteerd = actieveIds.has(product.id) && !isUitgevinkt;
                  // Bij meervoudige categorieën (accessoires/voeding/vitaminen) staat
                  // niets vooraf geselecteerd, dus een "beste match"-badge zou daar
                  // een keuze suggereren die we niet voor de klant hebben gemaakt.
                  const isBesteMatch = !isMeervoudig && product.id === c.opties[0].id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => kiesProduct(c.category.id, product.id, isMeervoudig)}
                      className={`group text-left rounded-2xl overflow-hidden border transition-all duration-200 min-w-0 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 ${
                        isGeselecteerd
                          ? "border-brand-gold bg-brand-gold/5 shadow-lg shadow-brand-gold/10"
                          : "border-brand-border bg-brand-card hover:border-brand-gold/30"
                      }`}
                    >
                      {/* Afbeelding */}
                      <div className="relative h-32 bg-brand-surface flex items-center justify-center overflow-hidden">
                        <ProductAfbeelding
                          src={product.afbeelding_url}
                          alt={product.naam}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        />
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
                        <p className="text-brand-ivory text-sm font-body leading-snug mb-1 line-clamp-2">{product.naam}</p>
                        {product.uitleg && (
                          <p className="text-brand-muted text-xs font-body leading-snug mb-2 line-clamp-2">
                            {product.uitleg}
                          </p>
                        )}
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
      <div className="lg:sticky lg:top-24 min-w-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
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
                  <ProductAfbeelding
                    src={product.afbeelding_url}
                    alt={product.naam}
                    sizes="40px"
                    className="object-contain p-1"
                    compact
                  />
                </div>
                <div className="min-w-0 flex-1" title={product.uitleg ?? undefined}>
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
          <div className="flex items-center justify-between pt-4 border-t border-brand-border mb-5 gap-2">
            <span className="text-brand-ivory font-body text-sm flex-shrink-0">Totaal</span>
            <span key={totaalprijs} className="font-mono text-brand-gold text-2xl font-medium truncate animate-check-in">
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
                className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-brand-border hover:border-brand-gold/40 transition-colors group"
              >
                <span className="text-brand-muted text-xs font-body truncate min-w-0 flex-1 group-hover:text-brand-ivory transition-colors">
                  {product.category.naam}: {product.naam}
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
