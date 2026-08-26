import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { parseFeedBuffer, bepaalBudgetklasseVoorCategorie, matchCategorie, detecteerGeslacht, schatNiveauEnFrequentie } from "@/lib/feed-import";
import { haalAlleProducten } from "@/lib/product-fetch";
import { matchSport } from "@/lib/sport-match";

type FeedAbonnement = {
  id: string;
  naam: string;
  feed_url: string;
  sport_id: string | null;
  provider_id: string | null;
  grens_budget: number;
  grens_midden: number;
};
type Categorie = { id: string; naam: string; slug: string };
type Sport = { id: string; naam: string; slug: string };

// Bovengrens per feed. Gemeten met faseringslogging op de zwaarste
// feed (Decathlon, 58.986 rijen): fetch ~13s, downloaden van de
// ONGECOMPRIMEERDE CSV-respons 66-130s (sterk wisselend, waarschijnlijk
// omdat Decathlons server — anders dan de gzip'te Awin-feeds — geen
// compressie aanbiedt, iets wat wij niet kunnen afdwingen), parse ~7s,
// classificatielus ~37s, update-batches ~60s → realistisch 185-265s
// totaal. 250s geeft daar redelijk de ruimte voor zonder de Vercel-
// functietijdslimiet (300s, zie de sync-routes) helemaal op te souperen
// — bij een trage download kan Decathlon dus nog steeds een keer
// uitvallen, maar dan altijd nét met deze duidelijke melding i.p.v. een
// kale HTML-crash, en de overige feeds in de rij lopen gewoon door.
const PER_FEED_TIJDSLIMIET_MS = 250_000;

/**
 * Verwerkt één feed-abonnement volledig: downloaden, parsen, matchen op
 * categorie/sport/geslacht en wegschrijven. Geeft de samenvattingstekst
 * terug bij succes (of een beschrijvende tekst bij een gecontroleerd
 * afgehandeld geval zoals "niet bereikbaar"); gooit een Error bij een
 * onverwachte fout, die de aanroeper (met de time-out-race) afvangt.
 */
async function verwerkAbonnement(
  supabase: SupabaseClient,
  abo: FeedAbonnement,
  categorieen: Categorie[],
  sporten: Sport[],
  categorieSlugPerId: Map<string, string>,
  naamMap: Map<string, Awaited<ReturnType<typeof haalAlleProducten>>[number]>,
  eanMap: Map<string | null, Awaited<ReturnType<typeof haalAlleProducten>>[number]>
): Promise<string> {
  // Claim dit abonnement atomisch via een conditionele update op
  // laatste_sync, vóórdat we de feed downloaden/verwerken. Voorkomt
  // dat overlappende aanroepen (bijv. een paar keer snel achter
  // elkaar op "Nu synchroniseren" klikken, of de nachtelijke cron
  // die samenvalt met een handmatige sync) dezelfde feed dubbel
  // verwerken — beide zouden anders onafhankelijk van elkaar
  // dezelfde "bestaande producten"-snapshot pakken vóórdat de ander
  // iets heeft weggeschreven, en zo dezelfde rijen dubbel invoegen.
  // Alleen de aanroep die de update daadwerkelijk raakt (0 rijen
  // als een ander proces net won) gaat door met verwerken.
  const nu = new Date();
  const claimDrempel = new Date(nu.getTime() - 5 * 60 * 1000).toISOString();
  const { data: geclaimd } = await supabase
    .from("feed_subscriptions")
    .update({ laatste_sync: nu.toISOString() })
    .eq("id", abo.id)
    .or(`laatste_sync.is.null,laatste_sync.lt.${claimDrempel}`)
    .select("id");

  if (!geclaimd || geclaimd.length === 0) {
    return "Overgeslagen: wordt al door een andere aanroep gesynchroniseerd";
  }

  const response = await fetch(abo.feed_url);
  if (!response.ok) {
    return `Feed niet bereikbaar (${response.status})`;
  }

  const buffer = await response.arrayBuffer();
  const bestandsnaamHint = abo.feed_url.toLowerCase().includes(".xlsx") ? "feed.xlsx" : "feed.csv";
  const { rijen: ruweRijen } = await parseFeedBuffer(buffer, bestandsnaamHint);

  let succes = 0, mislukt = 0, overgeslagen = 0, gedeactiveerd = 0;
  const voorbeeldenOvergeslagenCategorieen = new Set<string>();

  // Verzamel eerst alle te verwerken producten in twee lijsten —
  // daarna schrijven we ze in batches weg (i.p.v. één database-
  // aanroep per product, wat bij duizenden producten te traag is
  // en de functie-tijdslimiet overschrijdt).
  const teInsertenen: Record<string, unknown>[] = [];
  // Op id in plaats van een array: als meerdere feed-rijen in
  // dezelfde run naar hetzelfde bestaande product verwijzen (bijv.
  // maat/kleur-varianten met identieke naam), zou diezelfde rij
  // twee keer in één upsert-batch terechtkomen — Postgres staat dat
  // niet toe binnen één "ON CONFLICT DO UPDATE"-statement ("cannot
  // affect row a second time") en laat dan de HELE batch falen. Met
  // een Map op id overschrijft de laatste variant gewoon de vorige.
  const teUpdaten = new Map<string, Record<string, unknown>>();
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

    const genormaliseerdeNaam = rij.naam.toLowerCase().trim();
    const bestaand = (rij.ean && eanMap.get(rij.ean)) ?? naamMap.get(genormaliseerdeNaam);

    if (!category_id) {
      overgeslagen++;
      if (voorbeeldenOvergeslagenCategorieen.size < 8) {
        voorbeeldenOvergeslagenCategorieen.add(rij.categorie_ruw || rij.naam);
      }
      // Een BESTAAND, nog nooit door een admin bevestigd product dat nu
      // geen categorie meer matcht (bijv. omdat een matching-fix een
      // eerdere, foute match terecht heeft laten vervallen) moet niet
      // stilzwijgend op zijn oude, foute categorie blijven staan —
      // anders "heelt" de zelf-herstellende classificatie hierboven
      // wel bij een verbeterde match, maar nooit bij een vervallen
      // match. Zet 'm inactief i.p.v. te laten hangen met een
      // achterhaalde categorie.
      if (bestaand && !bestaand.geclassificeerd && bestaand.actief) {
        // .has()-check vóór het zetten, anders telt hetzelfde bestaande
        // product dubbel als meerdere feed-rijen (maat/kleur-varianten)
        // ernaar verwijzen — zelfde patroon als dubbelOvergeslagen hierboven.
        if (!teUpdaten.has(bestaand.id)) gedeactiveerd++;
        teUpdaten.set(bestaand.id, { ...bestaand, actief: false });
      }
      continue;
    }

    if (!bestaand) {
      // Alleen relevant voor NIEUWE producten: check of we deze naam
      // al eerder in deze zelfde run hebben ingepland om toe te voegen.
      if (nieuweNamenDitRun.has(genormaliseerdeNaam)) {
        dubbelOvergeslagen++;
        continue;
      }
      nieuweNamenDitRun.add(genormaliseerdeNaam);
    }

    if (bestaand) {
      // Meerdere feed-rijen (bijv. maat/kleur-varianten) kunnen naar
      // hetzelfde bestaande product verwijzen — die tellen dan niet
      // los mee als "verwerkt", vandaar deze aparte teller zodat de
      // samenvatting toch op het totaal aantal rijen uitkomt.
      if (teUpdaten.has(bestaand.id)) dubbelOvergeslagen++;
      // Een admin die dit product handmatig heeft bevestigd
      // (geclassificeerd: true) kan ook de categorie/sport gecorrigeerd
      // hebben — dat blijft ongewijzigd. Bij een nog-nooit-bevestigd
      // product (geclassificeerd: false) mogen we category_id/sport_id
      // wél opnieuw laten bepalen: zo corrigeren verbeteringen aan de
      // matching-logica (zoals deze) zich ook met terugwerkende kracht
      // op producten die al eerder gesynchroniseerd waren, in plaats
      // van voor altijd aan hun oude, mogelijk foute waarde vast te
      // zitten totdat een admin ze met de hand aanpast.
      const herclassificeren = !bestaand.geclassificeerd;
      const herClassificatieVelden = herclassificeren
        ? {
            category_id,
            sport_id: abo.sport_id || matchSport(`${rij.naam} ${rij.categorie_ruw}`, sporten ?? []) || null,
            budgetklasse: bepaalBudgetklasseVoorCategorie(
              prijsGetal,
              categorieSlugPerId.get(category_id) ?? null,
              Number(abo.grens_budget),
              Number(abo.grens_midden)
            ),
            geslacht: detecteerGeslacht(rij.naam, rij.categorie_ruw, rij.geslacht_ruw),
          }
        : {};
      teUpdaten.set(bestaand.id, {
        ...bestaand,
        ...herClassificatieVelden,
        prijs: prijsGetal,
        affiliate_url: rij.affiliate_url,
        afbeelding_url: rij.afbeelding_url || null,
      });
    } else {
      const budgetklasse = bepaalBudgetklasseVoorCategorie(
        prijsGetal,
        categorieSlugPerId.get(category_id) ?? null,
        Number(abo.grens_budget),
        Number(abo.grens_midden)
      );
      const { niveau, frequentie } = schatNiveauEnFrequentie(budgetklasse);
      const sport_id = abo.sport_id || matchSport(`${rij.naam} ${rij.categorie_ruw}`, sporten ?? []) || null;
      teInsertenen.push({
        naam: rij.naam,
        merk: rij.merk || null,
        sport_id,
        category_id,
        provider_id: abo.provider_id,
        prijs: prijsGetal,
        budgetklasse,
        geslacht: detecteerGeslacht(rij.naam, rij.categorie_ruw, rij.geslacht_ruw),
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
    // upsert op de unique constraint (provider_id, naam) i.p.v. een
    // kale insert: als onze eigen dedup-check (naamMap, hierboven)
    // door een randgeval tóch een bestaand product mist, faalt anders
    // de HELE batch van 500 in één keer op die ene botsende rij. Met
    // upsert wordt zo'n botsing gewoon een update van het bestaande
    // product in plaats van een fout. (PostgREST's onConflict kan
    // alleen kolomnamen targeten, geen expressie-index of
    // constraint-naam — vandaar dat de db-index op de kolom "naam"
    // zelf staat, niet op lower(naam).)
    const { error } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "provider_id,naam" });
    if (error) mislukt += batch.length; else succes += batch.length;
  }

  const teUpdatenArray = Array.from(teUpdaten.values());
  for (let i = 0; i < teUpdatenArray.length; i += BATCH_GROOTTE) {
    const batch = teUpdatenArray.slice(i, i + BATCH_GROOTTE);
    // upsert op basis van 'id' werkt hier als bulk-update, omdat elke
    // rij al een bestaand product-id heeft (primary key conflict
    // triggert een update in plaats van een nieuwe insert).
    const { error } = await supabase.from("products").upsert(batch, { onConflict: "id" });
    if (error) mislukt += batch.length; else succes += batch.length;
  }

  const voorbeelden = Array.from(voorbeeldenOvergeslagenCategorieen);
  // 'gedeactiveerd' zit al in zowel 'overgeslagen' (categorie kon niet
  // meer gematcht worden) als 'succes' (de deactivatie-update zelf
  // slaagde) — als apart getal eruit lichten voor een kloppend rapport
  // i.p.v. impliciet dubbel meetellen.
  const samenvatting = `${succes - gedeactiveerd} verwerkt, ${overgeslagen} overgeslagen (categorie, waarvan ${gedeactiveerd} bestaand product gedeactiveerd), ${dubbelOvergeslagen} dubbel overgeslagen, ${mislukt} mislukt (${ruweRijen.length} totaal)` +
    (voorbeelden.length > 0 ? ` — voorbeelden overgeslagen categorieën: ${voorbeelden.map((v) => `"${v}"`).join(", ")}` : "");

  await supabase.from("feed_subscriptions").update({
    laatste_sync: new Date().toISOString(),
    laatste_resultaat: samenvatting,
  }).eq("id", abo.id);

  return samenvatting;
}

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
  const { data: sporten } = await supabase.from("sports").select("id, naam, slug");
  const categorieSlugPerId = new Map((categorieen ?? []).map((c) => [c.id, c.slug]));
  const resultaten: Record<string, string> = {};

  // Eén keer opgehaald voor de hele run i.p.v. per feed opnieuw — dat
  // kostte voorheen 11-13s per feed (bij 7 feeds dus ~80s puur verspild
  // aan hetzelfde dedup-overzicht steeds opnieuw ophalen), en at zo
  // rechtstreeks in de tijd die elke afzonderlijke feed had voor zijn
  // eigen verwerking. Kleine kanttekening: een product dat een eerdere
  // feed in DEZE run net heeft toegevoegd, zit dus niet meer in dit
  // overzicht voor een latere feed — bij twee providers met toevallig
  // exact dezelfde productnaam/EAN zou dat een dubbele insert kunnen
  // geven, maar dat is in de praktijk zeldzaam genoeg om ruim op te
  // wegen tegen de tijdswinst.
  const bestaandeProducten = await haalAlleProducten(supabase);
  const naamMap = new Map(bestaandeProducten.map((p) => [p.naam.toLowerCase().trim(), p]));
  const eanMap = new Map(bestaandeProducten.filter((p) => p.ean).map((p) => [p.ean, p]));

  // Bewust NIET parallel: een test met alle feeds tegelijk (Decathlon
  // 58k, Direct Running 222k en Training Fit 159k rijen tegelijk in het
  // geheugen) liep binnen 150s vast op een JavaScript heap out-of-memory
  // crash bij een geheugenlimiet van 1024MB — Vercels standaard
  // functiegeheugen. Zo'n crash is een hárdere, zekerdere mislukking dan
  // het tijdsrisico van sequentieel verwerken, dus die ruil is het niet
  // waard. Sequentieel duurt langer in totaal, maar houdt op elk moment
  // maar de rijen van één feed tegelijk in het geheugen.
  for (const abo of abonnementen ?? []) {
    try {
      // Race tegen een eigen, lagere tijdslimiet dan Vercels
      // functietijdslimiet — zie PER_FEED_TIJDSLIMIET_MS hierboven.
      // Let op: dit annuleert de onderliggende fetch/verwerking niet
      // echt (JS kan een synchrone parse-lus niet van buitenaf
      // afbreken), maar zorgt er wel voor dat DEZE lus-iteratie op
      // tijd doorgaat naar de volgende feed i.p.v. voor onbepaalde
      // tijd te blijven hangen.
      const timeoutPromise: Promise<never> = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Time-out: verwerking duurde langer dan ${PER_FEED_TIJDSLIMIET_MS / 1000}s (feed is mogelijk te groot of te traag)`)),
          PER_FEED_TIJDSLIMIET_MS
        );
      });

      resultaten[abo.naam] = await Promise.race([
        verwerkAbonnement(supabase, abo, categorieen ?? [], sporten ?? [], categorieSlugPerId, naamMap, eanMap),
        timeoutPromise,
      ]);
    } catch (err) {
      resultaten[abo.naam] = `Fout: ${err instanceof Error ? err.message : "onbekend"}`;
    }
  }

  return { resultaten };
}
