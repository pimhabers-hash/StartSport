import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groepeerPerCategorieMetOpties, UNIVERSELE_CATEGORIEEN } from "@/lib/configurator-engine";
import { Navbar } from "@/components/home/Navbar";
import { PakketBuilder } from "@/components/resultaat/PakketBuilder";
import type { ErvaringNiveau, BudgetKlasse, GebruikFrequentie } from "@/lib/supabase/database.types";
import type { Doel } from "@/lib/configurator-engine";

// Elke bezoeker krijgt een eigen combinatie van queryparams (sport,
// niveau, budget, geslacht, ...) — geen twee bezoekers zien dezelfde
// inhoud op dezelfde URL, dus dit als doorzoekbare paginacontent laten
// indexeren levert alleen dunne/duplicate content op. Noindex i.p.v.
// robots.txt-disallow, zodat links naar aanbieders vanaf deze pagina
// nog wel gevolgd worden.
export const metadata = { title: "Jouw sportpakket — StartSport", robots: { index: false, follow: true } };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const LABEL: Record<string, string> = {
  beginner: "Beginner", gemiddeld: "Gemiddeld", gevorderd: "Gevorderd", competitie: "Competitie",
  budget: "Budget", middenklasse: "Middenklasse", premium: "Premium",
  recreatief: "Recreatief", wekelijks: "Wekelijks", intensief: "Intensief",
  binnen: "Binnen", buiten: "Buiten", beide: "Binnen & buiten",
  gezond_blijven: "Gezond blijven", afvallen: "Afvallen",
  sociaal: "Sociaal", prestatie: "Beter worden",
  man: "Voor heren", vrouw: "Voor dames",
};

export default async function ResultaatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { sport_id, sport_naam, niveau, budgetklasse, frequentie, doel, geslacht } = params;

  if (!sport_id || !niveau || !budgetklasse || !frequentie) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-muted mb-4">Ongeldige configuratie.</p>
          <Link href="/configurator" className="text-brand-gold underline">Terug naar configurator</Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  type RuweProductRij = {
    id: string; naam: string; merk: string | null; prijs: number;
    niveau: ErvaringNiveau[]; budgetklasse: BudgetKlasse; sport_id: string | null;
    geschikt_voor_frequentie: GebruikFrequentie[]; affiliate_url: string;
    afbeelding_url: string | null; uitleg: string | null; score: number;
    geslacht: "man" | "vrouw" | "unisex" | null;
    categories: { id: string; naam: string; slug: string } | { id: string; naam: string; slug: string }[] | null;
    providers: { naam: string; slug: string; logo_url: string | null } | { naam: string; slug: string; logo_url: string | null }[] | null;
  };
  const PRODUCT_SELECT = `
    id, naam, merk, prijs, niveau, budgetklasse, sport_id,
    geschikt_voor_frequentie, affiliate_url, afbeelding_url, uitleg, score, geslacht,
    categories ( id, naam, slug ),
    providers ( naam, slug, logo_url )
  `;

  // Sport-specifieke producten: volledig gepagineerd ophalen (geen cap) —
  // Supabase/PostgREST begrenst één select() standaard op 1000 rijen, en
  // sommige sporten (Golf 1400+, Fietsen 2500+) gaan daar overheen.
  const PAGINA_GROOTTE = 1000;
  const rawProducten: RuweProductRij[] = [];
  for (let vanaf = 0; ; vanaf += PAGINA_GROOTTE) {
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("sport_id", sport_id)
      .eq("actief", true)
      .order("id")
      .range(vanaf, vanaf + PAGINA_GROOTTE - 1);
    if (!data || data.length === 0) break;
    rawProducten.push(...data);
    if (data.length < PAGINA_GROOTTE) break;
  }

  // Universele producten (sport_id null, bijv. algemene kleding/tassen/
  // voeding die voor élke sport bruikbaar is): NIET volledig ophalen —
  // dat zijn er ruim 10.000 over de hele catalogus (elke sport levert
  // z'n eigen "sportloze" voorraad), terwijl er toch maar top-8 per
  // categorie getoond wordt. Per universele categorie apart een
  // redelijke voorraad ophalen (i.p.v. één gezamenlijke cap) zodat een
  // kleinere categorie (bijv. Tassen) niet wegvalt achter een veel
  // grotere (Kleding heeft doorgaans het gros van de universele rijen).
  const UNIVERSELE_CAP_PER_CATEGORIE = 300;
  const { data: universeleCategorieen } = await supabase
    .from("categories")
    .select("id")
    .in("slug", UNIVERSELE_CATEGORIEEN);
  const universeleResultaten = await Promise.all(
    (universeleCategorieen ?? []).map((cat) =>
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .is("sport_id", null)
        .eq("category_id", cat.id)
        .eq("actief", true)
        .order("id")
        .limit(UNIVERSELE_CAP_PER_CATEGORIE)
    )
  );
  universeleResultaten.forEach(({ data }) => {
    if (data) rawProducten.push(...(data as RuweProductRij[]));
  });

  if (rawProducten.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-brand-black pt-24 px-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">🏗️</p>
            <h2 className="font-display text-2xl text-brand-ivory mb-3">Producten komen eraan</h2>
            <p className="text-brand-muted text-sm mb-6">
              Voor deze sport zijn nog geen producten toegevoegd.
            </p>
            <Link href="/configurator" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
              Andere sport kiezen
            </Link>
          </div>
        </div>
      </>
    );
  }

  const producten = rawProducten.map((p) => ({
    ...p,
    merk: p.merk ?? null,
    afbeelding_url: p.afbeelding_url ?? null,
    uitleg: p.uitleg ?? null,
    binnen_buiten: null,
    category: Array.isArray(p.categories) ? p.categories[0] : p.categories as { id: string; naam: string; slug: string },
    provider: Array.isArray(p.providers) ? p.providers[0] : p.providers as { naam: string; slug: string; logo_url: string | null } | null,
  }));

  const categorieOpties = groepeerPerCategorieMetOpties(producten, {
    sport_id,
    sport_slug: params.sport_slug ?? "",
    niveau: niveau as ErvaringNiveau,
    budgetklasse: budgetklasse as BudgetKlasse,
    frequentie: frequentie as GebruikFrequentie,
    doel: doel as Doel | undefined,
    geslacht: geslacht as "man" | "vrouw" | "anders" | undefined,
  });

  const geslachtChip = geslacht === "man" || geslacht === "vrouw" ? geslacht : null;
  const chips = [niveau, budgetklasse, frequentie, doel, geslachtChip].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
              Jouw persoonlijke pakket
            </p>
            <h1 className="font-display text-4xl lg:text-5xl text-brand-ivory mb-4">
              {sport_naam} ·{" "}
              <em className="not-italic text-gold-gradient font-light">
                {LABEL[niveau] ?? niveau}
              </em>
            </h1>
            <div className="flex flex-wrap gap-2 mb-2">
              {chips.map((v) => (
                <span key={v} className="px-3 py-1 rounded-full border border-brand-gold/30 text-brand-gold text-xs font-mono">
                  {LABEL[v!] ?? v}
                </span>
              ))}
            </div>
            <p className="text-brand-muted text-sm font-body max-w-xl mt-3">
              Op basis van je antwoorden hebben we per categorie de beste match voor jou
              uitgezocht, plus alternatieven. Klik op een suggestie om 'm te wisselen in je
              pakket rechts — het is en blijft jouw eigen samenstelling.
            </p>
          </div>

          {/* Interactieve pakket-builder */}
          {categorieOpties.length > 0 ? (
            <PakketBuilder categorieOpties={categorieOpties} sportSlug={params.sport_slug ?? ""} />
          ) : (
            <div className="card-surface rounded-2xl p-12 text-center">
              <p className="text-brand-muted font-body">
                Geen producten gevonden voor dit profiel. Probeer een ander budget of niveau.
              </p>
            </div>
          )}

          {/* Opnieuw */}
          <div className="text-center mt-16">
            <Link
              href="/configurator"
              className="inline-flex items-center gap-2 text-brand-muted text-sm font-body hover:text-brand-ivory transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Andere configuratie proberen
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
