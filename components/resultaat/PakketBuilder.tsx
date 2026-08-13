"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductAfbeelding } from "@/components/ProductAfbeelding";
import { MEERVOUDIGE_CATEGORIEEN, type CategorieOpties, type PakketProduct } from "@/lib/configurator-engine";

interface PakketBuilderProps {
  categorieOpties: CategorieOpties[];
  sportSlug: string;
}

export function PakketBuilder({ categorieOpties, sportSlug }: PakketBuilderProps) {
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
  // Per categorie tonen we in eerste instantie maar een handvol opties —
  // de configurator haalt er tot 8 op zodat een klant zelf meer kan
  // aanvinken dan alleen de beste match, maar 8 kaarten per categorie
  // direct allemaal tonen maakt de pagina onoverzichtelijk lang. "Toon
  // meer" ontvouwt de rest.
  const STANDAARD_ZICHTBAAR = 4;
  const [uitgeklapt, setUitgeklapt] = useState<Set<string>>(new Set());

  function toggleUitgeklapt(categoryId: string) {
    setUitgeklapt((u) => {
      const nieuw = new Set(u);
      if (nieuw.has(categoryId)) nieuw.delete(categoryId);
      else nieuw.add(categoryId);
      return nieuw;
    });
  }

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

  // Eén "bestel bij X"-knop per aanbieder i.p.v. per product — een pakket
  // met producten van 3 aanbieders geeft zo 3 knoppen i.p.v. bijv. 8. Er
  // bestaat geen universele manier om producten van verschillende
  // webshops met één link al samen in een winkelmandje te krijgen (dat
  // hangt af van het platform van elke aanbieder afzonderlijk, niet iets
  // wat wij vanuit een affiliate-link kunnen afdwingen) — de knop opent
  // daarom alle bijbehorende producten in aparte tabbladen, zodat de
  // klant per aanbieder nog maar één keer hoeft te klikken. De losse
  // productlinks blijven daaronder ook gewoon staan voor wie liever per
  // stuk klikt, of als de browser extra tabbladen blokkeert.
  const perAanbieder = useMemo(() => {
    const groepen = new Map<string, { slug: string | null; producten: PakketProduct[] }>();
    geselecteerdeProducten.forEach((product) => {
      const naam = product.provider?.naam ?? "Overige aanbieders";
      const groep = groepen.get(naam) ?? { slug: product.provider?.slug ?? null, producten: [] };
      groep.producten.push(product);
      groepen.set(naam, groep);
    });
    return Array.from(groepen.entries()).map(([naam, { slug, producten }]) => ({ naam, slug, producten }));
  }, [geselecteerdeProducten]);

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

  function bestelAlles(producten: PakketProduct[]) {
    producten.forEach((product) => {
      trackKlik(product);
      window.open(product.affiliate_url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

      {/* Linkerkant: categorie-secties met suggesties */}
      <div className="space-y-10 min-w-0">
        {categorieOpties.map((c, i) => {
          const isMeervoudig = MEERVOUDIGE_CATEGORIEEN.includes(c.category.slug);
          const actieveIds = selectie[c.category.id] ?? new Set<string>();
          const isUitgevinkt = uitgevinkt.has(c.category.id);
          // Automatisch uitgeklapt tonen als de klant iets buiten de
          // standaard-zichtbare opties heeft aangevinkt (bijv. optie 6) —
          // anders "verdwijnt" een gekozen product uit beeld zodra de
          // sectie weer inklapt, terwijl het rechts in het pakket blijft.
          const heeftKeuzeBuitenStandaard = c.opties
            .slice(STANDAARD_ZICHTBAAR)
            .some((p) => actieveIds.has(p.id));
          const toonAlles = uitgeklapt.has(c.category.id) || heeftKeuzeBuitenStandaard;
          const zichtbareOpties = toonAlles ? c.opties : c.opties.slice(0, STANDAARD_ZICHTBAAR);
          const verborgenAantal = c.opties.length - zichtbareOpties.length;

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

              {/* Opties in deze categorie — horizontaal scrollend i.p.v. een
                  grid: op deze manier past "toon meer" als tegel rechts in
                  dezelfde rij, en onthult een klik daarop de rest van de
                  opties door verder naar rechts te kunnen slepen/scrollen,
                  in plaats van de pagina verticaal te verlengen. */}
              <div
                className={`flex gap-4 overflow-x-auto snap-x snap-proximity pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 transition-opacity ${isUitgevinkt ? "opacity-40 pointer-events-none" : ""}`}
              >
                {zichtbareOpties.map((product) => {
                  const isGeselecteerd = actieveIds.has(product.id) && !isUitgevinkt;
                  // Bij meervoudige categorieën (accessoires/voeding/vitaminen) staat
                  // niets vooraf geselecteerd, dus een "beste match"-badge zou daar
                  // een keuze suggereren die we niet voor de klant hebben gemaakt.
                  const isBesteMatch = !isMeervoudig && product.id === c.opties[0].id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => kiesProduct(c.category.id, product.id, isMeervoudig)}
                      className={`group text-left rounded-2xl overflow-hidden border transition-all duration-200 flex-shrink-0 w-[190px] sm:w-[210px] snap-start hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 ${
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
                          sizes="210px"
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

                {/* "Toon meer"-tegel rechts in de rij i.p.v. een losse knop
                    eronder — klikken voegt de rest van de opties toe aan
                    dezelfde rij, waarna je verder naar rechts kunt slepen/
                    scrollen om ze te zien. */}
                {verborgenAantal > 0 && (
                  <button
                    onClick={() => toggleUitgeklapt(c.category.id)}
                    className="flex-shrink-0 w-[130px] snap-start rounded-2xl border border-dashed border-brand-gold/30 bg-brand-card/40 flex flex-col items-center justify-center gap-2 text-brand-gold hover:bg-brand-gold/5 hover:border-brand-gold/60 transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-mono text-center px-3 leading-snug">
                      Toon {verborgenAantal} meer
                    </span>
                  </button>
                )}
              </div>

              {toonAlles && !heeftKeuzeBuitenStandaard && c.opties.length > STANDAARD_ZICHTBAAR && (
                <button
                  onClick={() => toggleUitgeklapt(c.category.id)}
                  className="mt-2 text-xs font-mono text-brand-muted hover:text-brand-ivory transition-colors"
                >
                  Toon minder
                </button>
              )}
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

          {/* Bestel-knoppen, gegroepeerd per aanbieder */}
          <div className="space-y-5">
            {perAanbieder.map(({ naam, slug, producten }) => (
              <div key={naam}>
                <div className="flex items-stretch gap-1.5">
                  <button
                    onClick={() => bestelAlles(producten)}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 px-4 py-3 rounded-xl gold-shimmer text-brand-black text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <span className="truncate min-w-0 flex-1 text-left">
                      Bestel bij {naam} ({producten.length} product{producten.length !== 1 ? "en" : ""})
                    </span>
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {slug && (
                    <Link
                      href={`/aanbieders/${slug}${sportSlug ? `?sport=${sportSlug}` : ""}`}
                      title={`Alle ${naam}-producten voor deze sport bekijken`}
                      className="flex-shrink-0 flex items-center justify-center w-11 rounded-xl border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                        <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M9 3h4v4M13 3L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  )}
                </div>
                {producten.length > 1 && (
                  <p className="text-brand-muted text-[11px] font-body mt-1.5 mb-2">
                    Opent {producten.length} tabbladen — één per product. Blokkeert je browser dat, klik dan hieronder per product.
                  </p>
                )}
                <div className="space-y-1.5 mt-2">
                  {producten.map((product) => (
                    <a
                      key={product.id}
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackKlik(product)}
                      className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg border border-brand-border hover:border-brand-gold/40 transition-colors group"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
