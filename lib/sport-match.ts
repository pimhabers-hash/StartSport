export type Sport = { id: string; naam: string; slug: string };

function escapeRegex(tekst: string): string {
  return tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bevatAlsWoord(tekst: string, woord: string): boolean {
  if (!woord) return false;
  const patroon = new RegExp(`\\b${escapeRegex(woord)}s?\\b`, "i");
  return patroon.test(tekst);
}

/**
 * Trefwoorden per sport-slug (Engels/Nederlands/Duits/Spaans, feeds zijn
 * internationaal) — zelfde aanpak als CATEGORIE_TREFWOORDEN in
 * lib/feed-import.ts. Nodig omdat productnamen in universele feeds
 * (bijv. Sportsprofi) zelden letterlijk "padel" of "hardlopen" bevatten,
 * maar vaak wel een herkenbaar los woord als "running", "voetbalschoen"
 * of "yoga". Handmatig onderhouden lijst, alleen voor sporten die we nu
 * kennen — een nieuwe, nog niet hierin opgenomen sport valt terug op de
 * directe naam/slug-match hieronder.
 */
const SPORT_TREFWOORDEN: Record<string, string[]> = {
  padel:      ["padel"],
  tennis:     ["tennis"],
  pickleball: ["pickleball", "pickle ball"],
  hardlopen:  ["hardlopen", "hardloop", "running", "run", "jogging", "trailrunning", "trail running", "marathon"],
  fitness:    ["fitness", "gym", "yoga", "dumbbell", "kettlebell", "crossfit", "workout", "krachttraining"],
  volleybal:  ["volleybal", "volleyball", "beachvolley"],
  voetbal:    ["voetbal", "football", "soccer", "voetbalschoen"],
  wandelen:   ["wandelen", "wandel", "hiking", "hike", "trekking", "nordic walking", "walking pole"],
  wintersport: ["wintersport", "ski", "skiën", "snowboard", "ski touring", "skitour"],
};

/**
 * Probeert een sport te herkennen in vrije tekst (bijv. productnaam +
 * ruwe feed-categorie) — voor universele feeds/imports zonder vaste
 * sport_id. Checkt eerst het trefwoorden-woordenboek (herkent bijv. een
 * "running shoe" als Hardlopen, ook zonder dat "hardlopen" letterlijk in
 * de tekst staat), en valt daarna terug op een directe match van de
 * sportnaam/-slug zelf — zo werkt het ook voor sporten die nog niet in
 * de trefwoordenlijst staan. Bij de directe match wint de langste
 * sportnaam eerst, zodat een specifiekere naam (bijv. "beachvolleybal")
 * voorrang krijgt boven een kortere naam die er toevallig ook in
 * voorkomt (bijv. "volleybal").
 */
export function matchSport(tekst: string, sporten: Sport[]): string | null {
  if (!tekst) return null;

  for (const sport of sporten) {
    const trefwoorden = SPORT_TREFWOORDEN[sport.slug];
    if (!trefwoorden) continue;
    if (trefwoorden.some((woord) => bevatAlsWoord(tekst, woord))) {
      return sport.id;
    }
  }

  const gesorteerdeSporten = [...sporten].sort((a, b) => b.naam.length - a.naam.length);
  for (const sport of gesorteerdeSporten) {
    const slugAlsTekst = sport.slug.replace(/-/g, " ");
    if (bevatAlsWoord(tekst, sport.naam) || bevatAlsWoord(tekst, slugAlsTekst)) {
      return sport.id;
    }
  }

  return null;
}
