import { createClient } from "@supabase/supabase-js";
import { parseFeedBuffer, bepaalBudgetklasse, matchCategorie, detecteerGeslacht, schatNiveauEnFrequentie } from "@/lib/feed-import";

/**
 * Voert de synchronisatie van alle actieve feed-abonnementen uit.
 * Gedeeld tussen de nachtelijke cron-job en de "Nu synchroniseren"-knop
 * in de admin, zodat er geen dubbele logica of interne HTTP-aanroepen
 * naar de eigen site nodig zijn (die op Vercel problematisch zijn).
 */
export async function syncAlleFeeds(): Promise<{ resultaten: Record<string, string> }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: abonnementen } = await supabase
    .from("feed_subscriptions")
    .select("*")
    .eq("actief", true);

  const { data: categorieen } = await supabase.from("categories").select("id, naam, slug");
  const resultaten: Record<string, string> = {};

  for (const abo of abonnementen ?? []) {
    try {
      const response = await fetch(abo.feed_url);
      if (!response.ok) {
        resultaten[abo.naam] = `Feed niet bereikbaar (${response.status})`;
        continue;
      }

      const buffer = await response.arrayBuffer();
      const bestandsnaamHint = abo.feed_url.toLowerCase().includes(".xlsx") ? "feed.xlsx" : "feed.csv";
      const { rijen: ruweRijen } = await parseFeedBuffer(buffer, bestandsnaamHint);

      const { data: bestaandeProducten } = await supabase
        .from("products")
        .select("id, naam, ean");
      const naamMap = new Map((bestaandeProducten ?? []).map((p) => [p.naam.toLowerCase().trim(), p.id]));
      const eanMap = new Map((bestaandeProducten ?? []).filter((p) => p.ean).map((p) => [p.ean, p.id]));

      let succes = 0, mislukt = 0, overgeslagen = 0;
      const voorbeeldenOvergeslagenCategorieen = new Set<string>();

      // Verzamel eerst alle te verwerken producten in twee lijsten —
      // daarna schrijven we ze in batches weg (i.p.v. één database-
      // aanroep per product, wat bij duizenden producten te traag is
      // en de functie-tijdslimiet overschrijdt).
      const teInsertenen: Record<string, unknown>[] = [];
      const teUpdaten: Record<string, unknown>[] = [];
      // Houdt bij welke productnamen we in DEZE synchronisatie al gaan
      // toevoegen — voorkomt dubbele inserts wanneer een feed meerdere
      // regels heeft voor exact hetzelfde product (bijv. één regel per
      // maat/kleur-variant met identieke naam maar geen EAN).
      const nieuweNamenDitRun = new Set<string>();
      let dubbelOvergeslagen = 0;

      for (const rij of ruweRijen) {
        if (!rij.naam || !rij.prijs || !rij.affiliate_url) { mislukt++; continue; }
        const prijsGetal = parseFloat(rij.prijs.replace(",", "."));
        if (isNaN(prijsGetal)) { mislukt++; continue; }

        const category_id = rij.categorie_ruw || rij.naam
          ? matchCategorie(rij.categorie_ruw, categorieen ?? [], rij.naam)
          : null;
        if (!category_id) {
          overgeslagen++;
          if (voorbeeldenOvergeslagenCategorieen.size < 8) {
            voorbeeldenOvergeslagenCategorieen.add(rij.categorie_ruw || rij.naam);
          }
          continue;
        }

        const genormaliseerdeNaam = rij.naam.toLowerCase().trim();
        const bestaand_id = (rij.ean && eanMap.get(rij.ean)) ?? naamMap.get(genormaliseerdeNaam);

        if (!bestaand_id) {
          // Alleen relevant voor NIEUWE producten: check of we deze naam
          // al eerder in deze zelfde run hebben ingepland om toe te voegen.
          if (nieuweNamenDitRun.has(genormaliseerdeNaam)) {
            dubbelOvergeslagen++;
            continue;
          }
          nieuweNamenDitRun.add(genormaliseerdeNaam);
        }

        if (bestaand_id) {
          teUpdaten.push({
            id: bestaand_id,
            prijs: prijsGetal,
            affiliate_url: rij.affiliate_url,
            afbeelding_url: rij.afbeelding_url || null,
          });
        } else {
          const budgetklasse = bepaalBudgetklasse(prijsGetal, Number(abo.grens_budget), Number(abo.grens_midden));
          const { niveau, frequentie } = schatNiveauEnFrequentie(budgetklasse);
          teInsertenen.push({
            naam: rij.naam,
            merk: rij.merk || null,
            sport_id: abo.sport_id,
            category_id,
            provider_id: abo.provider_id,
            prijs: prijsGetal,
            budgetklasse,
            geslacht: detecteerGeslacht(rij.naam),
            affiliate_url: rij.affiliate_url,
            afbeelding_url: rij.afbeelding_url || null,
            ean: rij.ean || null,
            niveau,
            geschikt_voor_frequentie: frequentie,
            score: 4.0,
            bron: "feed_sync",
            // Producten gaan direct live met een prijs-gebaseerde inschatting
            // van niveau/frequentie — 'geclassificeerd' geeft alleen aan of
            // een admin dit nog heeft willen bevestigen/corrigeren.
            geclassificeerd: false,
            actief: true,
          });
        }
      }

      // In batches van 500 wegschrijven — ruim binnen de limieten van
      // zowel Supabase als de functie-tijdslimiet, ook bij 40.000+ rijen.
      const BATCH_GROOTTE = 500;

      for (let i = 0; i < teInsertenen.length; i += BATCH_GROOTTE) {
        const batch = teInsertenen.slice(i, i + BATCH_GROOTTE);
        const { error } = await supabase.from("products").insert(batch);
        if (error) mislukt += batch.length; else succes += batch.length;
      }

      for (let i = 0; i < teUpdaten.length; i += BATCH_GROOTTE) {
        const batch = teUpdaten.slice(i, i + BATCH_GROOTTE);
        // upsert op basis van 'id' werkt hier als bulk-update, omdat elke
        // rij al een bestaand product-id heeft (primary key conflict
        // triggert een update in plaats van een nieuwe insert).
        const { error } = await supabase.from("products").upsert(batch, { onConflict: "id" });
        if (error) mislukt += batch.length; else succes += batch.length;
      }

      const voorbeelden = Array.from(voorbeeldenOvergeslagenCategorieen);
      const samenvatting = `${succes} verwerkt, ${overgeslagen} overgeslagen (categorie), ${dubbelOvergeslagen} dubbel overgeslagen, ${mislukt} mislukt (${ruweRijen.length} totaal)` +
        (voorbeelden.length > 0 ? ` — voorbeelden overgeslagen categorieën: ${voorbeelden.map((v) => `"${v}"`).join(", ")}` : "");
      resultaten[abo.naam] = samenvatting;

      await supabase.from("feed_subscriptions").update({
        laatste_sync: new Date().toISOString(),
        laatste_resultaat: samenvatting,
      }).eq("id", abo.id);
    } catch (err) {
      resultaten[abo.naam] = `Fout: ${err instanceof Error ? err.message : "onbekend"}`;
    }
  }

  return { resultaten };
}
