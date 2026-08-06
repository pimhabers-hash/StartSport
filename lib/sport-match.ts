export type Sport = { id: string; naam: string; slug: string };

function escapeRegex(tekst: string): string {
  return tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bevatAlsWoord(tekst: string, woord: string): boolean {
  if (!woord) return false;
  const patroon = new RegExp(`\\b${escapeRegex(woord)}\\b`, "i");
  return patroon.test(tekst);
}

/**
 * Probeert een sport te herkennen in vrije tekst (bijv. productnaam +
 * ruwe feed-categorie) — voor universele feeds/imports zonder vaste
 * sport_id. Langste sportnaam eerst, zodat een specifiekere naam
 * (bijv. "beachvolleybal") voorrang krijgt boven een kortere naam die
 * er toevallig ook in voorkomt (bijv. "volleybal").
 */
export function matchSport(tekst: string, sporten: Sport[]): string | null {
  if (!tekst) return null;

  const gesorteerdeSporten = [...sporten].sort((a, b) => b.naam.length - a.naam.length);

  for (const sport of gesorteerdeSporten) {
    const slugAlsTekst = sport.slug.replace(/-/g, " ");
    if (bevatAlsWoord(tekst, sport.naam) || bevatAlsWoord(tekst, slugAlsTekst)) {
      return sport.id;
    }
  }

  return null;
}
