import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groepeerPerCategorieMetOpties } from "@/lib/configurator-engine";
import { Navbar } from "@/components/home/Navbar";
import { PakketBuilder } from "@/components/resultaat/PakketBuilder";
import type { ErvaringNiveau, BudgetKlasse, GebruikFrequentie, BinnenBuiten } from "@/lib/supabase/database.types";
import type { Doel } from "@/lib/configurator-engine";

export const metadata = { title: "Jouw sportpakket — StartSport" };

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
};

export default async function ResultaatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { sport_id, sport_naam, niveau, budgetklasse, frequentie, binnen_buiten, doel, geslacht } = params;

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

  const { data: rawProducten } = await supabase
    .from("products")
    .select(`
      id, naam, merk, prijs, niveau, budgetklasse,
      geschikt_voor_frequentie, affiliate_url, afbeelding_url, uitleg, score, geslacht,
      categories ( id, naam, slug ),
      providers ( naam, logo_url )
    `)
    .eq("sport_id", sport_id)
    .eq("actief", true);

  if (!rawProducten || rawProducten.length === 0) {
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
    provider: Array.isArray(p.providers) ? p.providers[0] : p.providers as { naam: string; logo_url: string | null } | null,
  }));

  const categorieOpties = groepeerPerCategorieMetOpties(producten, {
    sport_id,
    sport_slug: params.sport_slug ?? "",
    niveau: niveau as ErvaringNiveau,
    budgetklasse: budgetklasse as BudgetKlasse,
    frequentie: frequentie as GebruikFrequentie,
    binnen_buiten: binnen_buiten as BinnenBuiten | undefined,
    doel: doel as Doel | undefined,
    geslacht: geslacht as "man" | "vrouw" | "anders" | undefined,
  });

  const chips = [niveau, budgetklasse, frequentie, binnen_buiten, doel].filter(Boolean);

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
              Voor elke categorie tonen we onze beste match, plus alternatieven. Klik op een
              suggestie om die te wisselen in je pakket rechts.
            </p>
          </div>

          {/* Interactieve pakket-builder */}
          {categorieOpties.length > 0 ? (
            <PakketBuilder categorieOpties={categorieOpties} />
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
