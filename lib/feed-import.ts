import * as XLSX from "xlsx";

const ALIASSEN: Record<string, string[]> = {
  naam:           ["naam", "productnaam", "title", "productname"],
  merk:           ["merk", "brandname", "brand"],
  prijs:          ["prijs", "searchprice", "displayprice", "storeprice", "price", "baseprice"],
  affiliate_url:  ["affiliateurl", "awdeeplink", "merchantdeeplink", "deeplink", "url", "basketlink"],
  afbeelding_url: ["imagedefault", "imageurl", "image", "afbeeldingurl", "merchantimageurl", "awimageurl", "largeimage", "afbeelding", "merchantthumburl"],
  ean:            ["ean", "productgtin", "gtin"],
  categorie_ruw:  ["categorie", "merchantcategory", "categoryname", "merchantproductcategorypath"],
  // Sommige feeds (bijv. Daisycon-standaard) leveren een schoon
  // "gender_target"-veld (male/female/unisex) — betrouwbaarder dan
  // gokken op basis van de productnaam. Optioneel: feeds zonder dit veld
  // vallen gewoon terug op de bestaande naam/categorie-detectie.
  geslacht_ruw:   ["gendertarget", "gender", "geslacht", "targetgender"],
};

export interface RuweFeedRij {
  naam: string;
  merk: string;
  prijs: string;
  affiliate_url: string;
  afbeelding_url: string;
  ean: string;
  categorie_ruw: string;
  geslacht_ruw: string;
}

export interface KolomHerkenning {
  veld: string;
  gevondenHeader: string | null;
}

// Detecteert automatisch of een CSV-bestand komma, puntkomma of tab als
// scheidingsteken gebruikt — sommige exports (zoals "CSV voor Excel" met
// Nederlandse regio-instellingen) gebruiken standaard een puntkomma.
function detecteerScheidingsteken(tekst: string): string {
  const eersteRegel = tekst.split(/\r?\n/)[0] ?? "";
  const tellingen: Record<string, number> = {
    ",": (eersteRegel.match(/,/g) ?? []).length,
    ";": (eersteRegel.match(/;/g) ?? []).length,
    "\t": (eersteRegel.match(/\t/g) ?? []).length,
  };
  const beste = Object.entries(tellingen).sort((a, b) => b[1] - a[1])[0];
  return beste && beste[1] > 0 ? beste[0] : ",";
}
// spaties/underscores/streepjes weg, en onzichtbare tekens (zoals een
// BOM die Excel soms toevoegt bij het opslaan als CSV/UTF-8) verwijderd.
function normaliseer(tekst: string): string {
  return String(tekst)
    .replace(/^\uFEFF/, "")           // BOM aan het begin van de tekst
    .replace(/[\u200B-\u200F\uFEFF]/g, "") // overige onzichtbare tekens
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function vindKolom(headers: string[], veld: string): { index: number; header: string | null } {
  const mogelijkeNamen = ALIASSEN[veld] ?? [veld];
  const genormaliseerdeHeaders = headers.map(normaliseer);

  // Poging 1: exacte match na normalisatie
  for (const naam of mogelijkeNamen) {
    const idx = genormaliseerdeHeaders.indexOf(normaliseer(naam));
    if (idx !== -1) return { index: idx, header: headers[idx] };
  }

  // Poging 2 (vangnet): gedeeltelijke match — vangt varianten op zoals
  // "aw product name" of kolommen met een extra prefix/suffix (bijv.
  // "link" matcht dan alsnog de alias "deeplink"). Let op: dit is
  // bewust een brede match — een expliciete Poging-1-alias (zoals
  // "imageurl" hierboven bij afbeelding_url) is de juiste manier om een
  // veld dat hier per ongeluk aan een verkeerde, kortere kolom zou
  // plakken (zoals ooit "url") alsnog voorrang te geven, in plaats van
  // Poging 2 zelf strenger te maken — dat brak eerder de matching van
  // andere feeds waar een korte kolomnaam (zoals "link") wél terecht
  // via een langere alias gevonden moest worden.
  for (const naam of mogelijkeNamen) {
    const genorm = normaliseer(naam);
    const idx = genormaliseerdeHeaders.findIndex((h) => h.includes(genorm) || genorm.includes(h));
    if (idx !== -1) return { index: idx, header: headers[idx] };
  }

  return { index: -1, header: null };
}

const AFBEELDING_EXTENSIE = /\.(jpe?g|png|webp|gif)(\?|;|$)/i;

/**
 * Sommige feeds (bijv. Sportsprofi) leveren voor de afbeeldingskolom geen
 * directe URL, maar een trackingpixel-redirect met de échte afbeelding
 * verstopt in een query-parameter, en soms een niet-ingevulde
 * "!!TIME_STAMP!!"-macro erin. Zo'n URL rechtstreeks als <img src>
 * gebruiken geeft een kapotte afbeelding. Deze functie herkent dat
 * patroon en probeert de echte afbeeldings-URL uit de query-parameters
 * te halen; lukt dat niet, dan geven we niets terug (liever geen
 * afbeelding tonen dan een kapotte).
 */
function opschonenAfbeeldingUrl(ruweUrl: string): string {
  if (!ruweUrl) return ruweUrl;
  if (!ruweUrl.includes("!!TIME_STAMP!!") && AFBEELDING_EXTENSIE.test(ruweUrl)) {
    return ruweUrl; // ziet er al uit als een directe afbeeldings-URL
  }

  try {
    const url = new URL(ruweUrl);
    for (const waarde of url.searchParams.values()) {
      if (/^https?:\/\//i.test(waarde) && AFBEELDING_EXTENSIE.test(waarde)) {
        // Sommige feeds plakken meerdere URL's achter elkaar gescheiden
        // door "; " (bijv. Sportsprofi's trg-parameter) — pak de eerste.
        return waarde.split(/;\s*/)[0];
      }
    }
  } catch {
    // ruweUrl was geen geldige URL — val door naar "geen afbeelding"
  }

  return "";
}

function rijenUitTabel(rows: unknown[][]): { rijen: RuweFeedRij[]; herkenning: KolomHerkenning[]; ruweHeaders: string[] } {
  if (rows.length < 2) return { rijen: [], herkenning: [], ruweHeaders: [] };
  const headers = rows[0].map((h) => String(h ?? ""));

  const velden = ["naam", "merk", "prijs", "affiliate_url", "afbeelding_url", "ean", "categorie_ruw", "geslacht_ruw"];
  const kolomIndex: Record<string, number> = {};
  const herkenning: KolomHerkenning[] = [];

  velden.forEach((veld) => {
    const { index, header } = vindKolom(headers, veld);
    kolomIndex[veld] = index;
    herkenning.push({ veld, gevondenHeader: header });
  });

  // Extra, optionele categorie-verrijking: sommige feeds (bijv. Decathlon)
  // splitsen de categorie op in aparte, veel specifiekere kolommen
  // ("subcategories", "subsubcategories") náást het brede hoofdveld dat
  // via categorie_ruw hierboven al gevonden is. Dat hoofdveld ("Wandelen",
  // "Zwemmen") is prima voor sport-herkenning, maar zegt niets over het
  // producttype (schoen/tas/kleding) — dat staat wél in deze kolommen
  // ("Zwemkleding > Sport zwemkleding dames"). Geen aparte alias-entry
  // hiervoor (dat zou categorie_ruw dubbel maken), gewoon een directe
  // kolomzoektocht op exacte naam, en de waarden aan categorie_ruw plakken.
  const genormaliseerdeHeaders = headers.map(normaliseer);
  const extraCategorieKolommen = ["subcategories", "subsubcategories"]
    .map((naam) => genormaliseerdeHeaders.indexOf(naam))
    .filter((idx) => idx !== -1);

  const resultaat: RuweFeedRij[] = [];
  for (let i = 1; i < rows.length; i++) {
    const rij = rows[i];
    if (!rij || rij.length === 0) continue;
    const lees = (idx: number) => (idx >= 0 && rij[idx] != null ? String(rij[idx]).trim() : "");
    const categorieDelen = [lees(kolomIndex.categorie_ruw), ...extraCategorieKolommen.map(lees)].filter(Boolean);
    resultaat.push({
      naam: lees(kolomIndex.naam),
      merk: lees(kolomIndex.merk),
      prijs: lees(kolomIndex.prijs),
      affiliate_url: lees(kolomIndex.affiliate_url),
      afbeelding_url: opschonenAfbeeldingUrl(lees(kolomIndex.afbeelding_url)),
      ean: lees(kolomIndex.ean),
      categorie_ruw: categorieDelen.join(" "),
      geslacht_ruw: lees(kolomIndex.geslacht_ruw),
    });
  }
  return { rijen: resultaat, herkenning, ruweHeaders: headers };
}

export interface ParseFeedResultaat {
  rijen: RuweFeedRij[];
  herkenning: KolomHerkenning[];
  ruweHeaders: string[];
  scheidingsteken?: string;
}

/**
 * Pakt een gzip-gecomprimeerd bestand uit met de ingebouwde
 * DecompressionStream API (beschikbaar in browsers en Node 18+),
 * zodat we geen extra library nodig hebben.
 */
async function pakGzipUit(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const stream = new Response(buffer).body!.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function isZip(bytes: Uint8Array): boolean {
  // ZIP-bestanden (waaronder .xlsx, want dat is intern een zip) beginnen met "PK"
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/**
 * Verwerkt een feed-bestand tot een uniforme rijenlijst. Het echte
 * formaat wordt herkend aan de inhoud zelf (magic bytes), niet aan de
 * bestandsnaam — belangrijk omdat automatisch gegenereerde feed-URL's
 * vaak geen (juiste) bestandsextensie hebben, en soms gzip-gecomprimeerd
 * worden aangeleverd zonder dat dat uit de naam blijkt.
 */
export async function parseFeedBuffer(buffer: ArrayBuffer, bestandsnaam: string): Promise<ParseFeedResultaat> {
  let werkBuffer = buffer;
  let bytes = new Uint8Array(werkBuffer.slice(0, 4));

  if (isGzip(bytes)) {
    werkBuffer = await pakGzipUit(werkBuffer);
    bytes = new Uint8Array(werkBuffer.slice(0, 4));
  }

  const isExcel = isZip(bytes) || /\.xlsx?$/i.test(bestandsnaam);

  if (isExcel) {
    const workbook = XLSX.read(werkBuffer, { type: "array" });
    const eersteSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(eersteSheet, { header: 1, raw: false });
    return rijenUitTabel(rows);
  }

  const tekst = new TextDecoder("utf-8").decode(werkBuffer);
  const scheidingsteken = detecteerScheidingsteken(tekst);
  const workbook = XLSX.read(tekst, { type: "string", FS: scheidingsteken });
  const eersteSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(eersteSheet, { header: 1, raw: false });
  return { ...rijenUitTabel(rows), scheidingsteken: scheidingsteken === "\t" ? "tab" : scheidingsteken };
}

export function bepaalBudgetklasse(
  prijs: number,
  grensBudget: number,
  grensMidden: number
): "budget" | "middenklasse" | "premium" {
  if (prijs < grensBudget) return "budget";
  if (prijs < grensMidden) return "middenklasse";
  return "premium";
}

/**
 * Prijsgrenzen per categorie voor de budget/middenklasse/premium-indeling.
 * Eén vaste grens per aanbieder (de oude aanpak, via feed_subscriptions.
 * grens_budget/grens_midden) zou een racket van €150 en een grip van €150
 * hetzelfde noemen — voor een racket is dat middenklasse, voor een grip
 * absurd duur. Bepaald op basis van het 33e/66e prijspercentiel per
 * categorie in de huidige catalogus, zodat elke categorie in ongeveer
 * drie realistische, gelijke groepen uiteenvalt. Een categorie die hier
 * niet in staat (nieuw, of nog zonder producten) valt terug op de
 * grenzen van het feed-abonnement zelf — zie bepaalBudgetklasseVoorCategorie.
 */
export const CATEGORIE_BUDGET_GRENZEN: Record<string, { budget: number; midden: number }> = {
  racket:                     { budget: 110, midden: 185 },
  // Golfclubs zitten in een heel andere prijsklasse dan rackets (33e/66e
  // percentiel van de huidige catalogus: €260 / €475) — vandaar een
  // eigen grens i.p.v. de racket-grens hergebruiken.
  clubs:                      { budget: 260, midden: 475 },
  // Sticks: nog nauwelijks eigen voorraad, dus geschat op basis van
  // typische hockeystick-prijzen i.p.v. een echte percentielberekening.
  sticks:                     { budget: 50,  midden: 120 },
  schoenen:                   { budget: 70,  midden: 110 },
  tassen:                     { budget: 60,  midden: 100 },
  // Bovenkleding/onderkleding hergebruiken vooralsnog dezelfde grenzen
  // als de oude gezamenlijke "kleding"-categorie — geen aparte
  // percentielberekening beschikbaar sinds de opsplitsing, en beide
  // prijzen doorgaans vergelijkbaar.
  kleding:                    { budget: 29,  midden: 48 },
  bovenkleding:               { budget: 29,  midden: 48 },
  onderkleding:               { budget: 29,  midden: 48 },
  ballen:                     { budget: 7,   midden: 18 },
  accessoires:                { budget: 13,  midden: 20 },
  bescherming:                { budget: 14,  midden: 21 },
  voeding:                    { budget: 15,  midden: 30 },
  // Boards en fietsen: nog geen eigen catalogus om percentielen op te
  // baseren, dus een grove inschatting op basis van typische prijzen
  // (een skateboard/basic SUP tegenover een surfboard, resp. een los
  // onderdeel tegenover een complete race-/mountainbike).
  boards:                     { budget: 80,  midden: 250 },
  "fietsen-categorie":        { budget: 100, midden: 400 },
  "vitaminen-en-supplementen": { budget: 20, midden: 27 },
};

export function bepaalBudgetklasseVoorCategorie(
  prijs: number,
  categorieSlug: string | null,
  fallbackGrensBudget: number,
  fallbackGrensMidden: number
): "budget" | "middenklasse" | "premium" {
  const grenzen = categorieSlug ? CATEGORIE_BUDGET_GRENZEN[categorieSlug] : undefined;
  if (grenzen) return bepaalBudgetklasse(prijs, grenzen.budget, grenzen.midden);
  return bepaalBudgetklasse(prijs, fallbackGrensBudget, fallbackGrensMidden);
}

// Meertalige trefwoorden om geslacht uit een productnaam te herkennen.
// Woordgrenzen zijn belangrijk: "men" mag niet matchen binnen "women".
// "mens"/"womens" apart erbij omdat het Engelse bezits-s ("Mens Shoe",
// "Womens Jacket") anders geen eigen woordgrens rond "men"/"women" heeft.
const GESLACHT_TREFWOORDEN: { geslacht: "man" | "vrouw"; patroon: RegExp }[] = [
  { geslacht: "vrouw", patroon: /\b(women|womens|woman|dames|damen|mujer|femme|female|ladies)\b/i },
  { geslacht: "man",   patroon: /\b(men|mens|heren|herren|hombre|homme|male)\b/i },
];

/**
 * Herkent letterlijke waarden uit een schoon "gender_target"-veld dat
 * sommige feeds standaard meeleveren (bijv. Daisycon: male/female/
 * unisex) — betrouwbaarder dan tekst gokken, dus deze bron krijgt
 * voorrang in detecteerGeslacht hieronder wanneer aanwezig.
 */
function mapGeslachtVeld(ruw: string): "man" | "vrouw" | "unisex" | null {
  const waarde = ruw.trim().toLowerCase();
  if (["male", "man", "men", "heren", "boy", "boys"].includes(waarde)) return "man";
  if (["female", "vrouw", "women", "dames", "girl", "girls"].includes(waarde)) return "vrouw";
  if (["unisex", "mixed", "kids", "kid", "children", "onbekend", ""].includes(waarde)) return "unisex";
  return null;
}

/**
 * Probeert het geslacht (man/vrouw/unisex) te bepalen. Volgorde van
 * betrouwbaarheid: een schoon gender_target-veld dat expliciet "man" of
 * "vrouw" zegt is het meest betrouwbaar en wint altijd. Een "unisex" (of
 * onherkende/lege) waarde uit dat veld wordt NIET meteen als eindantwoord
 * genomen — in de praktijk blijkt dat bij sommige aanbieders (Jumbo
 * Sports, Padel Market) vaak gewoon een luie standaardwaarde in de
 * broninnen is, ook voor producten die in hun eigen naam overduidelijk
 * "Heren"/"Dames" zeggen (bijv. "Wilson D7 Xs Fairwaywood Heren" kreeg zo
 * ten onrechte "unisex"). Bij een onduidelijk/leeg veld valt het dus
 * alsnog terug op de productnaam/-categorie hieronder, en pas als ook
 * dáár niets gevonden wordt, is "unisex" de uitkomst.
 *
 * Voor de naam/categorie-tekst: "vrouw" wordt vóór "man" gecheckt, omdat
 * "women" anders per ongeluk op het "men"-patroon zou matchen. De
 * categorie is nodig omdat sommige aanbieders (bijv. Training Fit, een
 * Awin-feed met Franse categorietaxonomie) het geslacht nauwelijks in de
 * productnaam zelf vermelden ("Damesbeha", geen "Homme"/"Femme"), maar
 * wel betrouwbaar in elke categorie ("Multisports > Brassière > Adulte >
 * Femme"). De tekst wordt ook door de sport/algemene voorvoegsel-losknip
 * gehaald (zelfde mechanisme als bij categorie-matching): zonder die stap
 * heeft "dames"/"heren" in een aaneengeschreven woord als "Damesbadpak"
 * of "Herenbroek" geen eigen woordgrens en wordt het gemist — dit bleek
 * de hoofdoorzaak van Decathlons extreem hoge unisex-percentage (76%).
 */
export function detecteerGeslacht(naam: string, categorieRuw: string = "", geslachtVeld: string = ""): "man" | "vrouw" | "unisex" {
  if (geslachtVeld) {
    const uitVeld = mapGeslachtVeld(geslachtVeld);
    if (uitVeld === "man" || uitVeld === "vrouw") return uitVeld;
  }
  const tekst = loskoppelSportVoorvoegsel(`${naam} ${categorieRuw}`);
  for (const { geslacht, patroon } of GESLACHT_TREFWOORDEN) {
    if (patroon.test(tekst)) return geslacht;
  }
  return "unisex";
}

/**
 * Schat niveau en frequentie in op basis van de budgetklasse — een
 * pragmatische vuistregel (geen wetenschap): budget-producten zijn
 * doorgaans geschikter voor beginners die recreatief spelen, premium-
 * producten voor gevorderde/competitieve, frequente spelers. Dit is een
 * startpunt zodat producten niet blind "onclassified" blijven liggen;
 * een admin kan dit altijd corrigeren via de bulk-classificatietool.
 */
export function schatNiveauEnFrequentie(budgetklasse: "budget" | "middenklasse" | "premium"): {
  niveau: string[];
  frequentie: string[];
} {
  switch (budgetklasse) {
    case "budget":
      return { niveau: ["beginner", "gemiddeld"], frequentie: ["recreatief", "wekelijks"] };
    case "middenklasse":
      return { niveau: ["gemiddeld", "gevorderd"], frequentie: ["wekelijks"] };
    case "premium":
      return { niveau: ["gevorderd", "competitie"], frequentie: ["wekelijks", "intensief"] };
  }
}

// Meertalige trefwoorden per categorie-slug — nodig omdat affiliate-feeds
// vaak Engelse of Spaanse categorienamen gebruiken (bijv. Padel Market
// levert Spaanstalige productdata), terwijl onze eigen categorieën
// Nederlandse namen hebben.
const CATEGORIE_TREFWOORDEN: Record<string, string[]> = {
  // Let op: GEEN kale "paddle" hier — Decathlon's eigen topcategorie voor
  // stand-up paddleboarding heet letterlijk "Stand Up Paddle (SUP)", dus
  // dat woord ving daarmee alle SUP-boards, -pompen en -onderdelen ook
  // op als "Racket". "racket"/"pala"/"raqueta" dekken padel/tennis al
  // voldoende zonder dat risico.
  racket:       ["racket", "raquet", "raqueta", "pala", "racquet", "batje", "batjes", "tafeltennisbat", "tafeltennisbatje"],
  // Golfclubs en hockeysticks zijn geen "racket" — andere sport, ander
  // woord, en (zie CATEGORIE_BUDGET_GRENZEN) een compleet andere
  // prijsklasse, dus een eigen categorie i.p.v. meeliften op racket.
  // Let op: GEEN kale "stok"/"stokken" hier — dat woord is veel te
  // generiek (tentstokken, skistokken, nordic walking-stokken, massage-
  // stokken, vlieger-bouwstokken bevatten het allemaal ook) en pikte
  // producten uit compleet andere sporten op. Alleen expliciete
  // golf-samenstellingen.
  clubs:        ["golfstok", "golfstokken", "golfclub", "golfclubs"],
  sticks:       ["hockeystick"],
  schoenen:     ["schoen", "schoenen", "shoe", "zapatilla", "calzado", "footwear", "chaussure", "strandschoenen", "turnschoenen", "teenslippers", "slippers"],
  // Let op: GEEN kaal "handbal"/"basketbal" hier — Decathlons eigen
  // topcategorie-label voor die hele sportafdeling is zelf ook letterlijk
  // "Basketbal"/"Handbal" en staat zo als los woord in de ruwe categorie
  // van ELK product uit die afdeling (braces, markeringspijlen, sokken,
  // niet alleen de bal). Zie STERKE_BALSIGNALEN hieronder voor de wél
  // betrouwbare, specifieke variant.
  ballen:       ["bal", "ballen", "ball", "bola", "pelota"],
  tassen:       ["tas", "tassen", "bag", "bolsa", "mochila", "backpack", "stickbag", "cartbag", "standbag"],
  // Kleding is opgesplitst in Bovenkleding/Onderkleding (op klantverzoek,
  // zodat je zelf uit shirts vs. broeken kunt kiezen i.p.v. één gemengde
  // stapel) — "kleding" zelf blijft bestaan als restcategorie voor
  // kledingstukken die geen boven- of onderstuk zijn (hele pakken,
  // jurken, zwemkleding, wetsuits): die vallen niet eerlijk in één van
  // de twee te verdelen.
  bovenkleding: [
    "shirt", "tshirt", "t-shirt", "maillot", "camiseta",
    "jacket", "chaqueta", "veste",
    "sweat", "sweater", "sweatshirt", "hoodie", "hooded", "sudadera", "polaire", "fleece", "trui",
    "polo", "tank", "brassiere", "beha", "bra",
  ],
  onderkleding: [
    "short", "pant", "pantalon", "trouser", "broek", "jogbroek", "joggingbroek",
    "skirt", "falda", "skort", "legging", "boardshort", "boardshorts",
  ],
  kleding:      [
    "kleding", "cloth", "clothing", "apparel", "ropa", "textil",
    "dress", "vestido",
    // Samengestelde Nederlandse woorden — "kleding" heeft er middenin
    // geen eigen woordgrens (zelfde probleem als eerder bij "boks..."),
    // dus expliciet de vormen die in de praktijk veel voorkomen. Dit
    // zijn allemaal hele/eendelige kledingstukken, vandaar de
    // restcategorie i.p.v. bovenkleding/onderkleding.
    "badkleding", "zwemkleding", "strandkleding", "surfkleding", "turnkleding",
    "zonbescherming", "turnpakje", "turnpakjes", "wetsuit", "badpak", "badpakken", "jurk", "jurkje",
  ],
  accessoires:  ["accessoire", "accessory", "accesorio", "grip", "overgrip", "wristband", "muneca", "sock", "calcetin", "chaussette", "sok", "sokken", "cap", "gorra", "strip", "hoes", "cover", "funda", "taskar", "taskarren", "tasaccessoire", "tasaccessoires"],
  voeding:      ["voeding", "nutrition", "suplemento", "protein", "proteina"],
  // "boksracket"/"kickboksracket"/"thaiboksracket" expliciet: dit zijn
  // stootkussens/focus mitts (trainingsmateriaal), geen tennis-achtige
  // rackets — zonder deze compounds zou de losknip-stap (die "Boksracket"
  // terecht als Boksen-sport herkent) het woord "racket" ook los laten
  // staan en zo bij de Racket-categorie laten belanden.
  bescherming:  ["bescherming", "protection", "proteccion", "guard", "protector", "gant", "handschoen", "glove", "shinguard", "scheenbeschermer", "helm", "boksracket", "kickboksracket", "thaiboksracket"],
  "vitaminen-en-supplementen": [
    "vitamine", "vitaminen", "vitamin", "supplement", "mineraal", "mineral",
    "capsule", "capsul", "gummies", "collageen", "collagen",
    "magnesium", "creatine", "ashwagandha", "probiotica", "probiotic",
  ],
  // "Boards" bundelt surf-/SUP-/skate-/snowboards — één categorie i.p.v.
  // vier bijna-lege losse categorieën voor vergelijkbare platte planken.
  boards:       ["skateboard", "surfboard", "supboard", "sup board", "wakeboard", "snowboard", "surfplank", "bodyboard"],
  // De fiets zelf en fietsonderdelen (frame, wielen, aandrijving) — te
  // uiteenlopend qua onderdeeltype om los te splitsen, dus één brede
  // categorie voor "dit heeft met de fiets zelf te maken".
  "fietsen-categorie": [
    "racefiets", "mountainbike", "mtb", "stadsfiets", "kinderfiets",
    "fietsband", "fietsbanden", "fietsonderdeel", "fietsonderdelen", "fietsframe", "fietswiel", "fietswielen",
  ],
};

// Per categorie-slug: trefwoorden die ALLEEN tellen als ze in de ruwe
// feed-categorie voorkomen (nooit in de productnaam-candidaten) — voor
// signalen die te specifiek/betrouwbaar zijn om als gewoon trefwoord te
// gebruiken, maar via de normale candidate-volgorde (productnaam eerst)
// nooit aan bod zouden komen. Concreet: Decathlon labelt de bal zelf
// exact als "Handballen"/"Basketballen" (meervoud) in de subcategorie,
// heel anders dan de generieke, herhaalde "Handbal"/"Basketbal"
// afdelingsnaam die op ELK product in die sportafdeling staat (braces,
// markeringspijlen, sokken) — dat laatste is te breed om als trefwoord
// te gebruiken. Het probleem: de productnaam van een echte bal bevat
// vaak "Grip" ("... Pure Grip NO. 2.5"), wat normaliter al Accessoires
// laat winnen vóórdat de ruwe categorie ooit gecheckt wordt — vandaar
// deze aparte, voorrang-krijgende stap.
const STERKE_RUWE_CATEGORIE_SIGNALEN: Record<string, string[]> = {
  ballen: ["handballen", "basketballen"],
};

// Categorieën waarvan de naam een risico op valse vangnet-matches geeft —
// voor deze categorieën mag de "vangnet"-match op c.naam/c.slug in
// matchCategorie() niet gebruikt worden (alleen de expliciete
// trefwoorden hierboven tellen). Alle vijf zijn niche-categorieën met
// al goed onderhouden trefwoordenlijsten, dus de vangnet voegt weinig
// toe — en heeft herhaaldelijk fout gematcht: "Clubs" is ook het gewone
// woord voor sportverenigingen ("tafeltennistafel voor clubs"), "Sticks"
// matchte een energiedrank-poeder ("4 sticks"), en "Fietsen" matchte
// Decathlons eigen brede department-label op cross-sell-producten
// (een hardloop-drinkfles onder "Bikepacking", een koptelefoon onder
// een fietscollectie) die zelf niets met een fiets te maken hebben.
const CATEGORIE_ZONDER_NAAM_VANGNET = new Set(["clubs", "sticks", "racket", "boards", "fietsen-categorie"]);

// Sportnamen die in Nederlandse feeds vaak aan het zelfstandig naamwoord
// vastgeplakt worden i.p.v. los geschreven ("padeltas", "padelracket",
// "padelballen") — anders dan de meeste Engelse/Spaanse feeds ("padel
// bag", "padel racket"). Woordgrens-matching herkent de trefwoorden dan
// niet meer omdat ze middenin een aaneengeschreven woord zitten.
const SPORT_VOORVOEGSELS = [
  "padel", "tennis", "voetbal", "volleybal", "hockey", "hardloop", "fitness", "pickleball", "basketbal", "golf", "boks", "kickboks", "thaiboks",
  "zwem", "fiets", "badminton", "tafeltennis", "handbal", "klim", "duik", "skateboard", "trampoline", "surf", "paardrijd",
];

// Algemene Nederlandse doelgroep-voorvoegsels die net zo vaak vastplakken
// aan het zelfstandig naamwoord ("Kinderhelm", "Damesracket",
// "Herenschoenen") — zonder deze losknip mist bijv. "helm" zijn woordgrens
// in "Kinderhelm" en valt het product tussen wal en schip (of belandt het
// via een ander, minder passend trefwoord in de verkeerde categorie).
const ALGEMENE_VOORVOEGSELS = ["kinder", "dames", "heren", "junior", "senior", "unisex"];

/**
 * Knipt bekende sportnaam- en doelgroep-voorvoegsels los van wat erna komt
 * (bijv. "Padelballen" → "Padel ballen", "Kinderhelm" → "Kinder helm"),
 * zodat de trefwoorden-matching hieronder ze alsnog als apart woord
 * herkent.
 */
function loskoppelSportVoorvoegsel(tekst: string): string {
  let resultaat = tekst;
  for (const voorvoegsel of [...SPORT_VOORVOEGSELS, ...ALGEMENE_VOORVOEGSELS]) {
    resultaat = resultaat.replace(new RegExp(`\\b(${voorvoegsel})([a-z])`, "gi"), "$1 $2");
  }
  return resultaat;
}

function escapeRegex(tekst: string): string {
  return tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Test of een trefwoord als los WOORD voorkomt in de tekst (met optioneel
 * meervoud op -s) — niet als losse substring. Dit voorkomt valse matches
 * zoals "bal" (trefwoord voor Ballen) dat anders ook zou matchen binnen
 * namen als "Baltar", "Balda", "Balto" of "Balon" (Bullpadel-kledinglijnen).
 */
function bevatAlsWoord(tekst: string, trefwoord: string): boolean {
  const patroon = new RegExp(`\\b${escapeRegex(trefwoord)}s?\\b`, "i");
  return patroon.test(tekst);
}

// Volgorde waarin categorieën gecontroleerd worden. Belangrijk bij
// samengestelde productnamen zoals "Racket Bag" — dat is een TAS (het
// zelfstandig naamwoord, wat het product daadwerkelijk is), geen racket
// (dat beschrijft alleen waar de tas voor bedoeld is). Door "tassen" en
// "schoenen" vóór "racket" te checken, wint de juiste, specifiekere
// categorie in plaats van het eerst-gevonden woord.
const CATEGORIE_PRIORITEIT = ["tassen", "schoenen", "bovenkleding", "onderkleding", "kleding", "ballen", "vitaminen-en-supplementen", "accessoires", "voeding", "bescherming", "racket", "clubs", "sticks", "boards", "fietsen-categorie"];

export function matchCategorie(
  ruweTekst: string,
  categorieen: { id: string; naam: string; slug: string }[],
  productNaam: string = ""
): string | null {
  // Productnaam eerst: die is een specifieker, betrouwbaarder signaal dan
  // de ruwe feed-categorie. Sommige aanbieders (bijv. Padeldiscount) geven
  // vrijwel elk product dezelfde brede ruwe categorie ("Padel accessoires")
  // mee, ongeacht of het een tas, bal of racket is — als die tekst als
  // eerste gecheckt zou worden, wint dat catch-all label meteen en komt de
  // (juistere) productnaam nooit meer aan bod.
  // Zowel de originele tekst als de sport-voorvoegsel-losgeknipte variant
  // worden gecheckt: sommige trefwoorden zijn juist bedoeld als aaneen-
  // geschreven samenstelling (bijv. "golfstokken"), andere hebben het
  // voorvoegsel nodig om als los woord herkend te worden (bijv.
  // "padelballen" → "padel ballen" → "ballen").
  const kandidaten = [productNaam, ruweTekst]
    .filter(Boolean)
    .flatMap((tekst) => [tekst, loskoppelSportVoorvoegsel(tekst)]);

  // Sterke, ondubbelzinnige signalen in de RUWE categorie krijgen voorrang
  // op de hele candidate-volgorde hieronder — anders zou bijv. "Grip" in
  // de productnaam van een bal ("... Pure Grip NO. 2.5") al Accessoires
  // laten winnen vóórdat de ruwe categorie (die exact "Handballen" zegt)
  // ooit gecheckt wordt.
  if (ruweTekst) {
    for (const categorie of categorieen) {
      const signalen = STERKE_RUWE_CATEGORIE_SIGNALEN[categorie.slug];
      if (signalen?.some((woord) => bevatAlsWoord(ruweTekst, woord))) {
        return categorie.id;
      }
    }
  }

  // Sorteer de meegegeven categorieën op onze vaste prioriteitsvolgorde,
  // zodat categorieën die niet in de lijst staan (aangepaste categorieën)
  // gewoon achteraan komen, zonder te crashen.
  const gesorteerdeCategorieen = [...categorieen].sort((a, b) => {
    const prioA = CATEGORIE_PRIORITEIT.indexOf(a.slug);
    const prioB = CATEGORIE_PRIORITEIT.indexOf(b.slug);
    return (prioA === -1 ? 999 : prioA) - (prioB === -1 ? 999 : prioB);
  });

  for (const tekst of kandidaten) {
    // Trefwoorden eerst, in prioriteitsvolgorde — dit zijn specifieke
    // producttype-indicatoren (bag/shoe/ball) en betrouwbaarder dan een
    // toevallige match op onze eigen categorienaam.
    for (const categorie of gesorteerdeCategorieen) {
      const trefwoorden = CATEGORIE_TREFWOORDEN[categorie.slug];
      if (!trefwoorden) continue;
      if (trefwoorden.some((woord) => bevatAlsWoord(tekst, woord))) {
        return categorie.id;
      }
    }

    // Vangnet: directe match op onze eigen categorienaam/slug (bijv.
    // Nederlandse productnamen die toevallig geen Engels trefwoord bevatten).
    // Uitgezonderd: categorieën waarvan de naam een gangbaar Nederlands
    // woord met een heel andere betekenis is — "Clubs" matcht anders ook
    // op "tafeltennistafel voor clubs" (sportverenigingen, geen golfclubs).
    const directeMatch = gesorteerdeCategorieen.find(
      (c) =>
        !CATEGORIE_ZONDER_NAAM_VANGNET.has(c.slug) &&
        (bevatAlsWoord(tekst, c.slug) || bevatAlsWoord(tekst, c.naam))
    );
    if (directeMatch) return directeMatch.id;
  }

  return null;
}
