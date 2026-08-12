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
  sport_id: string | null;
  category: { id: string; naam: string; slug: string };
  provider: { naam: string; slug: string; logo_url: string | null } | null;
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

// Volgorde van budgetklassen — bepaalt welke twee klassen "naast elkaar"
// liggen voor het gedeeltelijke budget_naast-krediet hieronder.
const BUDGET_VOLGORDE: BudgetKlasse[] = ["budget", "middenklasse", "premium"];

// ─── Scoring gewichten ────────────────────────────────────────
const GEWICHT = {
  niveau:        40,
  budget_exact:  35,
  budget_naast:  10,
  frequentie:    12,
  binnen_buiten:  8,
  doel:           5,
  geslacht:      18,
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
  competitie:     ["racket", "clubs", "sticks", "boards", "fietsen-categorie", "schoenen", "accessoires"],
  sociaal:        ["tas", "kleding"],
  prestatie:      ["racket", "clubs", "sticks", "boards", "fietsen-categorie", "schoenen", "accessoires"],
};

/**
 * Categorieën die voor élke sport zinnig zijn, ook zonder dat een
 * product aan een specifieke sport gekoppeld is — voeding hoort nergens
 * exclusief bij. Kleding/tassen (algemene trainingskleding, sporttassen)
 * horen hier ook bij: dat zijn generieke, functioneel sportonafhankelijke
 * producttypes. "Accessoires" hoort hier expliciet NIET bij: die
 * categorie blijkt bij een steekproef ook oneigenlijke producten te
 * bevatten die alleen via een toevallige trefwoordmatch (bijv. "grip")
 * als accessoire zijn herkend — zoals paardrijstijgbeugels — en die
 * zouden bij een universele behandeling voor élke sport kunnen
 * verschijnen. Net als schoenen/racket/ballen/bescherming blijft
 * accessoires daarom alleen meetellen als er wél een sport gekoppeld is.
 * Relevant vooral voor brede multisport-aanbieders (bijv. Training Fit)
 * waarvan de meeste producten geen aparte sport vermelden — zonder deze
 * uitzondering voor kleding/tassen zou al hun kleding/sporttassen
 * nergens in de configurator verschijnen, ook al is het prima bruikbaar
 * voor elke sport.
 */
const UNIVERSELE_CATEGORIEEN = ["voeding", "vitaminen-en-supplementen", "kleding", "tassen"];

/**
 * Categorieën waarbij een klant logischerwijs nul, één, of meerdere
 * producten tegelijk zou kunnen willen — in tegenstelling tot bijv.
 * Racket/Schoenen/Kleding/Ballen/Tassen, waar je nu eenmaal maar één
 * exemplaar aanschaft en de configurator dus prima één "beste match"
 * vooraf mag selecteren. Bij deze categorieën is het juist fout om er
 * automatisch precies één te selecteren: een klant kan best meerdere
 * accessoires willen (grip én bidon én cap), of geen enkel supplement.
 * De UI (PakketBuilder) gebruikt dit om deze categorieën als
 * aan/uit-selectie per product te tonen i.p.v. als radio-keuze, zonder
 * standaard iets voor te selecteren.
 */
export const MEERVOUDIGE_CATEGORIEEN = ["accessoires", "voeding", "vitaminen-en-supplementen"];

/**
 * Volgorde waarin categorieën in het resultaat getoond worden — de
 * kernuitrusting (racket/schoenen/kleding/ballen/tassen) eerst, waar de
 * klant voor kwam, en de optionele extra's (accessoires/voeding/
 * vitaminen, zie MEERVOUDIGE_CATEGORIEEN hierboven) helemaal onderaan.
 * Onbekende/nieuwe categorieën vallen terug op alfabetisch, ná deze
 * vaste lijst.
 */
const CATEGORIE_VOLGORDE = [
  "kleding", "schoenen", "racket", "clubs", "sticks", "boards", "fietsen-categorie", "ballen", "tassen", "bescherming",
  "voeding", "vitaminen-en-supplementen", "accessoires",
];

function categorieSorteerWaarde(slug: string): number {
  const idx = CATEGORIE_VOLGORDE.indexOf(slug);
  return idx === -1 ? CATEGORIE_VOLGORDE.length : idx;
}

function sorteerOpCategorieVolgorde<T extends { category: { naam: string; slug: string } }>(a: T, b: T): number {
  const verschil = categorieSorteerWaarde(a.category.slug) - categorieSorteerWaarde(b.category.slug);
  return verschil !== 0 ? verschil : a.category.naam.localeCompare(b.category.naam);
}

/**
 * True als een product daadwerkelijk bij de gekozen sport hoort. Een
 * product telt alleen mee als het óf expliciet aan déze sport gekoppeld
 * is, óf universeel is (sport_id null) én in een sportonafhankelijke
 * categorie zit. Zonder deze check zou een universeel product (sport_id
 * null, bijv. uit een brede multisport-feed zonder vaste sport per rij)
 * voor élke sport meetellen — een hardloopschoen of scheenbeschermer hoort
 * dan alsnog niet thuis in een Fitness- of Padel-pakket, ook al is
 * "Schoenen"/"Bescherming" op zich een geldige categorie. Producten die
 * hierdoor nergens matchen, blijven gewoon zichtbaar op de
 * aanbiederspagina — die filtert niet op sport.
 */
function productHoortBijSport(product: ProductMatcher, sportId: string): boolean {
  if (product.sport_id === sportId) return true;
  return product.sport_id === null && UNIVERSELE_CATEGORIEEN.includes(product.category.slug);
}

/**
 * True als een product past bij de opgegeven geslachtsvoorkeur. Bij een
 * expliciete "man"/"vrouw"-keuze is dit een harde uitsluiting: een klant
 * die "Man" kiest, krijgt nooit een product te zien dat expliciet als
 * "vrouw" herkend is (en andersom) — ook niet als alternatief om uit te
 * kiezen. Unisex/onbekende producten (geen duidelijk geslacht in de
 * naam) passen altijd, voor iedereen. Zonder voorkeur ("anders" of niet
 * ingevuld) wordt niets uitgesloten — de zachte scoring-bonus in
 * berekenMatchScore zorgt daar voor een lichte, eerlijke voorkeur.
 */
function productPastBijGeslacht(product: ProductMatcher, geslacht?: "man" | "vrouw" | "anders"): boolean {
  if (geslacht !== "man" && geslacht !== "vrouw") return true;
  if (!product.geslacht || product.geslacht === "unisex") return true;
  return product.geslacht === geslacht;
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

  // 2. Budget — een aanpalende klasse (bijv. middenklasse voor wie
  // premium koos) krijgt gedeeltelijk krediet, symmetrisch in beide
  // richtingen. Alleen budget↔premium (twee klassen uit elkaar) krijgt
  // niets, want dat is geen realistisch alternatief.
  if (product.budgetklasse === input.budgetklasse) {
    score += GEWICHT.budget_exact;
  } else if (
    Math.abs(BUDGET_VOLGORDE.indexOf(input.budgetklasse) - BUDGET_VOLGORDE.indexOf(product.budgetklasse)) === 1
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

  // 6. Geslacht — bij een expliciete man/vrouw-keuze telt dit nu zwaar
  // genoeg mee om écht het verschil te maken tussen twee verder
  // vergelijkbare producten (bijv. dezelfde schoen in een heren- en
  // damesversie). Unisex-producten passen altijd, dus die krijgen
  // dezelfde volle bonus; bij een duidelijke mismatch (product is
  // "man", klant koos "vrouw") gewoon 0 punten — nooit hard uitsluiten,
  // want geslacht-data is een inschatting op basis van de productnaam.
  if (input.geslacht === "man" || input.geslacht === "vrouw") {
    if (!product.geslacht || product.geslacht === "unisex" || product.geslacht === input.geslacht) {
      score += GEWICHT.geslacht;
    }
  } else {
    // Geen voorkeur opgegeven ("anders" of helemaal niet ingevuld):
    // unisex/onbekend krijgt de volle bonus als veilige, voor iedereen
    // geschikte keuze. Man- en vrouw-producten krijgen een kleine,
    // GELIJKE bonus — zodat niet toevallig altijd dezelfde sekse wint
    // puur doordat die net iets beter scoort op andere factoren.
    if (!product.geslacht || product.geslacht === "unisex") {
      score += GEWICHT.geslacht;
    } else {
      score += GEWICHT.geslacht / 3;
    }
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
  return Array.from(perCategorie.values()).sort(sorteerOpCategorieVolgorde);
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
  // Alleen producten die daadwerkelijk bij deze sport horen — voorkomt
  // dat universele producten (sport_id null, bijv. uit een brede feed
  // zonder vaste sport) voor élke sport meetellen.
  const relevanteProducten = alleProducten.filter(
    (p) => productHoortBijSport(p, input.sport_id) && productPastBijGeslacht(p, input.geslacht)
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
    // Producten die écht bij déze sport horen (sport_id matcht) gaan altijd
    // vóór universele producten (sport_id null, alleen aanwezig via
    // UNIVERSELE_CATEGORIEEN) — die mogen meedoen maar niet de "Beste
    // match" en bovenste opties inpikken van een sport-specifiek product
    // met een toevallig iets lagere match_score. Binnen elke van de twee
    // groepen blijft match_score bepalend.
    const gesorteerd = producten.sort((a, b) => {
      const aSpecifiek = a.sport_id === input.sport_id ? 1 : 0;
      const bSpecifiek = b.sport_id === input.sport_id ? 1 : 0;
      if (aSpecifiek !== bSpecifiek) return bSpecifiek - aSpecifiek;
      return b.match_score - a.match_score;
    });
    resultaat.push({
      category: gesorteerd[0].category,
      opties: gesorteerd.slice(0, maxOptiesPerCategorie),
    });
  }

  return resultaat.sort(sorteerOpCategorieVolgorde);
}

function berekenAlternatief(
  alleProducten: ProductMatcher[],
  input: ConfiguratorInput,
  budgetOverride: BudgetKlasse
): PakketProduct[] {
  if (budgetOverride === input.budgetklasse) return [];
  const aangepast = { ...input, budgetklasse: budgetOverride };
  const gescoord = alleProducten
    .filter((p) => p.budgetklasse === budgetOverride && productPastBijGeslacht(p, input.geslacht))
    .map((p) => ({ ...p, match_score: berekenMatchScore(p, aangepast) }))
    .sort((a, b) => b.match_score - a.match_score);
  return selecteerPerCategorie(gescoord);
}

export function berekenPakket(
  alleProducten: ProductMatcher[],
  input: ConfiguratorInput
): ConfiguratorResultaat {
  const gescoord: PakketProduct[] = alleProducten
    .filter((p) => productPastBijGeslacht(p, input.geslacht))
    .map((p) => ({
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
