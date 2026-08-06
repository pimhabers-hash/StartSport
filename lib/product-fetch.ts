import type { SupabaseClient } from "@supabase/supabase-js";

export type BestaandProduct = { id: string; naam: string; ean: string | null };

const PAGINA_GROOTTE = 1000;

/**
 * Haalt id/naam/ean van ALLE producten op, gepagineerd in stappen van
 * 1000 rijen. Supabase begrenst een enkele select() standaard op 1000
 * rijen (project-instelling "max rows"), dus een losse .limit(100000)
 * gaf bij meer dan 1000 producten stilzwijgend een onvolledige lijst
 * terug — met als gevolg dubbele inserts i.p.v. updates bij feed-sync
 * en CSV-import.
 *
 * De .order("id") hieronder is niet optioneel: .range() zonder vaste
 * sortering geeft geen garantie dat opeenvolgende pagina's dezelfde
 * rijvolgorde gebruiken, waardoor rijen tussen pagina's kunnen "vallen"
 * en zo alsnog stilzwijgend ontbreken — met exact hetzelfde gevolg
 * (dubbele inserts) als de oorspronkelijke bug hierboven.
 */
export async function haalAlleProducten(supabase: SupabaseClient): Promise<BestaandProduct[]> {
  const alleProducten: BestaandProduct[] = [];

  for (let vanaf = 0; ; vanaf += PAGINA_GROOTTE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, naam, ean")
      .order("id")
      .range(vanaf, vanaf + PAGINA_GROOTTE - 1);

    if (error || !data || data.length === 0) break;

    alleProducten.push(...data);
    if (data.length < PAGINA_GROOTTE) break;
  }

  return alleProducten;
}
