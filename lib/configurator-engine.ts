/**
 * Configurator Engine v2
 * 
 * Versie 2 neemt binnen_buiten en doel mee in de scoring.
 * Zelfde input/output contract als v1 — UI hoeft niet te wijzigen.
 */

import type {
  ErvaringNiveau,
  BudgetKlasse,
  GebruikFrequentie,
  BinnenBuiten,
} from "@/lib/supabase/database.types";

export type Doel = "gezond_blijven" | "afvallen" | "competitie" | "sociaal" | "prestatie";

export interface ConfiguratorInput {
  sport_id: string;
  sport_slug: string;
  niveau: ErvaringNiveau;
  budgetklasse: BudgetKlasse;
  frequentie: GebruikFrequentie;
  binnen_buiten?: BinnenBuiten;
  doel?: Doel;
  geslacht?: "man" | "vrouw" | "anders";
}

export interface ProductMatcher {
  id: string;
  naam: string;
  merk: string | null;
  prijs: number;
  niveau: ErvaringNiveau[];
  budgetklasse: BudgetKlasse;
  geschikt_voor_frequentie: GebruikFrequentie[];
  affiliate_url: string;
  afbeelding_url: string | null;
  uitleg: string | null;
  score: number;
  binnen_buiten?: BinnenBuiten | null;
  geslacht?: "man" | "vrouw" | "unisex" | null;
  category: { id: string; naam: string; slug: string };
  provider: { naam: string; logo_url: string | null } | null;
}

export interface PakketProduct extends ProductMatcher {
  match_score: number;
}

export interface ConfiguratorResultaat {
  producten: PakketProduct[];
  totaalprijs: number;
  alternatief_goedkoper: PakketProduct[];
  alternatief_premium: PakketProduct[];
}

// ─── Scoring gewichten ────────────────────────────────────────
const GEWICHT = {
  niveau:        40,
  budget_exact:  35,
  budget_naast:  10,
  frequentie:    12,
  binnen_buiten:  8,
  doel:           5,
  geslacht:       6,
  kwaliteit:     10, // score 0–5 → 0–10 punten
};

/**
 * Doel-naar-categorie hints:
 * Sommige doelen maken bepaalde categorieën belangrijker.
 * Dit beïnvloedt de uitleg maar nog niet de score direct —
 * klaar om later AI-weging op te zetten.
 */
export const DOEL_CATEGORIE_HINTS: Record<Doel, string[]> = {
  gezond_blijven: ["schoenen", "kleding"],
  afvallen:       ["schoenen", "kleding", "accessoires"],
  competitie:     ["racket", "schoenen", "accessoires"],
  sociaal:        ["tas", "kleding"],
  prestatie:      ["racket", "schoenen", "accessoires"],
};

/**
 * Welke productcategorieën horen daadwerkelijk bij welke sport.
 * Nodig omdat feeds (vooral universele feeds zonder sport_id, zoals
 * Sportsprofi) producten aanleveren die met "sport_id IS NULL" voor
 * élke sport zouden meetellen — een racket of mudguard hoort dan
 * alsnog niet thuis in een Fitness- of Hardlopen-pakket. Categorieën
 * die voor geen enkele sport specifiek zijn (voeding/supplementen,
 * accessoires) staan bij elke sport in de lijst.
 *
 * Handmatig onderhouden (net als CATEGORIE_TREFWOORDEN/-PRIORITEIT in
 * lib/feed-import.ts) — met 7 sporten × 9 categorieën is een aparte
 * beheertabel vooralsnog overkill.
 */
export const SPORT_CATEGORIE_COMPATIBILITEIT: Record<string, string[]> = {
  padel:      ["racket", "ballen", "schoenen", "tassen", "kleding", "accessoires", "voeding", "vitaminen-en-supplementen"],
  tennis:     ["racket", "ballen", "schoenen", "tassen", "kleding", "accessoires", "voeding", "vitaminen-en-supplementen"],
  pickleball: ["racket", "ballen", "schoenen", "tassen", "kleding", "accessoires", "voeding", "vitaminen-en-supplementen"],
  voetbal:    ["ballen", "schoenen", "tassen", "kleding", "bescherming", "accessoires", "voeding", "vitaminen-en-supplementen"],
  volleybal:  ["ballen", "schoenen", "tassen", "kleding", "bescherming", "accessoires", "voeding", "vitaminen-en-supplementen"],
  hardlopen:  ["schoenen", "tassen", "kleding", "accessoires", "voeding", "vitaminen-en-supplementen"],
  fitness:    ["schoenen", "tassen", "kleding", "bescherming", "accessoires", "voeding", "vitaminen-en-supplementen"],
};

/**
 * True als een product met deze categorie relevant is voor de gekozen
 * sport. Onbekende sport-slugs (nog niet in de matrix opgenomen, bijv.
 * een net toegevoegde sport) laten alles door — anders zou een nieuwe
 * sport in de admin per direct een lege resultaatpagina geven totdat
 * iemand de matrix bijwerkt.
 */
function categorieHoortBijSport(categorieSlug: string, sportSlug: string): boolean {
  const toegestaan = SPORT_CATEGORIE_COMPATIBILITEIT[sportSlug];
  if (!toegestaan) return true;
  return toegestaan.includes(categorieSlug);
}

function berekenMatchScore(
  product: ProductMatcher,
  input: ConfiguratorInput
): number {
  let score = 0;

  // 1. Niveau
  if (product.niveau.includes(input.niveau)) {
    score += GEWICHT.niveau;
  }

  // 2. Budget
  if (product.budgetklasse === input.budgetklasse) {
    score += GEWICHT.budget_exact;
  } else if (
    (input.budgetklasse === "middenklasse" && product.budgetklasse === "budget") ||
    (input.budgetklasse === "middenklasse" && product.budgetklasse === "premium")
  ) {
    score += GEWICHT.budget_naast;
  }

  // 3. Frequentie
  if (product.geschikt_voor_frequentie.includes(input.frequentie)) {
    score += GEWICHT.frequentie;
  }

  // 4. Binnen/buiten (nieuw in v2)
  if (input.binnen_buiten && product.binnen_buiten) {
    if (
      product.binnen_buiten === input.binnen_buiten ||
      product.binnen_buiten === "beide" ||
      input.binnen_buiten === "beide"
    ) {
      score += GEWICHT.binnen_buiten;
    }
  } else {
    // Geen binnen_buiten op product → neutraal, kleine bonus
    score += GEWICHT.binnen_buiten / 2;
  }

  // 5. Doel (nieuw in v2) — boost categorieën die relevant zijn
  if (input.doel) {
    const hints = DOEL_CATEGORIE_HINTS[input.doel] ?? [];
    if (hints.includes(product.category.slug)) {
      score += GEWICHT.doel;
    }
  }

  // 6. Geslacht — unisex-producten passen altijd, dus die krijgen geen
  // straf. Alleen bij een expliciete man/vrouw-match op beide kanten
  // geven we een lichte boost; bij een duidelijke mismatch (product is
  // "man", gebruiker koos "vrouw") juist geen punten voor dit onderdeel.
  if (input.geslacht && input.geslacht !== "anders" && product.geslacht) {
    if (product.geslacht === "unisex" || product.geslacht === input.geslacht) {
      score += GEWICHT.geslacht;
    }
    // bij mismatch: gewoon 0 punten voor dit onderdeel, product blijft
    // zichtbaar (nooit hard uitsluiten — data is een inschatting)
  } else {
    score += GEWICHT.geslacht / 2; // neutraal als er geen voorkeur/data is
  }

  // 7. Productkwaliteit
  score += (product.score ?? 0) * (GEWICHT.kwaliteit / 5);

  return score;
}

function selecteerPerCategorie(producten: PakketProduct[]): PakketProduct[] {
  const perCategorie = new Map<string, PakketProduct>();
  for (const product of producten) {
    const bestaand = perCategorie.get(product.category.id);
    if (!bestaand || product.match_score > bestaand.match_score) {
      perCategorie.set(product.category.id, product);
    }
  }
  return Array.from(perCategorie.values()).sort((a, b) =>
    a.category.naam.localeCompare(b.category.naam)
  );
}

export interface CategorieOpties {
  category: { id: string; naam: string; slug: string };
  opties: PakketProduct[]; // gesorteerd op match_score, beste eerst
}

/**
 * Groepeert alle producten per categorie en geeft binnen elke categorie
 * de top N opties terug (gesorteerd op match), in plaats van alleen de
 * winnaar. Dit voedt de interactieve pakket-builder op de resultaatpagina,
 * waar de gebruiker zelf tussen suggesties per categorie kan wisselen.
 */
export function groepeerPerCategorieMetOpties(
  alleProducten: ProductMatcher[],
  input: ConfiguratorInput,
  maxOptiesPerCategorie = 4
): CategorieOpties[] {
  // Alleen categorieën die daadwerkelijk bij deze sport horen — voorkomt
  // dat universele producten (sport_id null, bijv. uit een brede feed)
  // als racket/mudguard/etc. in een pakket voor een niet-passende sport
  // terechtkomen.
  const relevanteProducten = alleProducten.filter((p) =>
    categorieHoortBijSport(p.category.slug, input.sport_slug)
  );

  const gescoord: PakketProduct[] = relevanteProducten.map((p) => ({
    ...p,
    match_score: berekenMatchScore(p, input),
  }));

  const perCategorie = new Map<string, PakketProduct[]>();
  for (const product of gescoord) {
    const lijst = perCategorie.get(product.category.id) ?? [];
    lijst.push(product);
    perCategorie.set(product.category.id, lijst);
  }

  const resultaat: CategorieOpties[] = [];
  for (const [, producten] of perCategorie) {
    const gesorteerd = producten.sort((a, b) => b.match_score - a.match_score);
    resultaat.push({
      category: gesorteerd[0].category,
      opties: gesorteerd.slice(0, maxOptiesPerCategorie),
    });
  }

  return resultaat.sort((a, b) => a.category.naam.localeCompare(b.category.naam));
}

function berekenAlternatief(
  alleProducten: ProductMatcher[],
  input: ConfiguratorInput,
  budgetOverride: BudgetKlasse
): PakketProduct[] {
  if (budgetOverride === input.budgetklasse) return [];
  const aangepast = { ...input, budgetklasse: budgetOverride };
  const gescoord = alleProducten
    .filter((p) => p.budgetklasse === budgetOverride)
    .map((p) => ({ ...p, match_score: berekenMatchScore(p, aangepast) }))
    .sort((a, b) => b.match_score - a.match_score);
  return selecteerPerCategorie(gescoord);
}

export function berekenPakket(
  alleProducten: ProductMatcher[],
  input: ConfiguratorInput
): ConfiguratorResultaat {
  const gescoord: PakketProduct[] = alleProducten.map((p) => ({
    ...p,
    match_score: berekenMatchScore(p, input),
  }));
  gescoord.sort((a, b) => b.match_score - a.match_score);

  const producten = selecteerPerCategorie(gescoord);
  const totaalprijs = producten.reduce((sum, p) => sum + p.prijs, 0);

  const goedkoper: BudgetKlasse =
    input.budgetklasse === "premium" ? "middenklasse" :
    input.budgetklasse === "middenklasse" ? "budget" : "budget";

  const duurder: BudgetKlasse =
    input.budgetklasse === "budget" ? "middenklasse" :
    input.budgetklasse === "middenklasse" ? "premium" : "premium";

  return {
    producten,
    totaalprijs,
    alternatief_goedkoper: berekenAlternatief(alleProducten, input, goedkoper),
    alternatief_premium:   berekenAlternatief(alleProducten, input, duurder),
  };
}
