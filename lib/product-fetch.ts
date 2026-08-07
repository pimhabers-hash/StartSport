import type { SupabaseClient } from "@supabase/supabase-js";

export type BestaandProduct = {
  id: string;
  naam: string;
  ean: string | null;
  merk: string | null;
  sport_id: string | null;
  category_id: string | null;
  provider_id: string | null;
  prijs: number;
  budgetklasse: string;
  niveau: string[];
  geschikt_voor_frequentie: string[];
  affiliate_url: string;
  afbeelding_url: string | null;
  uitleg: string | null;
  score: number;
  actief: boolean;
  geclassificeerd: boolean;
  bron: string | null;
  geslacht: string | null;
};

const PAGINA_GROOTTE = 1000;

const KOLOMMEN =
  "id, naam, ean, merk, sport_id, category_id, provider_id, prijs, budgetklasse, " +
  "niveau, geschikt_voor_frequentie, affiliate_url, afbeelding_url, uitleg, score, " +
  "actief, geclassificeerd, bron, geslacht";

/**
 * Haalt alle producten met hun volledige kolommen op, gepagineerd in
 * stappen van 1000 rijen. Supabase begrenst een enkele select()
 * standaard op 1000 rijen (project-instelling "max rows"), dus een
 * losse .limit(100000) gaf bij meer dan 1000 producten stilzwijgend een
 * onvolledige lijst terug — met als gevolg dubbele inserts i.p.v.
 * updates bij feed-sync en CSV-import.
 *
 * De .order("id") hieronder is niet optioneel: .range() zonder vaste
 * sortering geeft geen garantie dat opeenvolgende pagina's dezelfde
 * rijvolgorde gebruiken, waardoor rijen tussen pagina's kunnen "vallen"
 * en zo alsnog stilzwijgend ontbreken — met exact hetzelfde gevolg
 * (dubbele inserts) als de oorspronkelijke bug hierboven.
 *
 * Alle kolommen (niet alleen id/naam/ean) zijn nodig omdat een bulk-
 * upsert bij het bijwerken van bestaande producten (lib/sync-feeds.ts)
 * de volledige rij moet meesturen: Postgres vereist bij
 * "INSERT ... ON CONFLICT DO UPDATE" dat ook de NOT NULL-kolommen in de
 * (nooit uitgevoerde) insert-tak aanwezig zijn, anders faalt de hele
 * batch-update.
 */
export async function haalAlleProducten(supabase: SupabaseClient): Promise<BestaandProduct[]> {
  const alleProducten: BestaandProduct[] = [];

  for (let vanaf = 0; ; vanaf += PAGINA_GROOTTE) {
    const { data, error } = await supabase
      .from("products")
      .select(KOLOMMEN)
      .order("id")
      .range(vanaf, vanaf + PAGINA_GROOTTE - 1);

    if (error || !data || data.length === 0) break;

    alleProducten.push(...(data as unknown as BestaandProduct[]));
    if (data.length < PAGINA_GROOTTE) break;
  }

  return alleProducten;
}
