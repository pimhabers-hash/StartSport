import * as XLSX from "xlsx";

const ALIASSEN: Record<string, string[]> = {
  naam:           ["naam", "productnaam", "title", "productname"],
  merk:           ["merk", "brandname", "brand"],
  prijs:          ["prijs", "searchprice", "displayprice", "storeprice", "price", "baseprice"],
  affiliate_url:  ["affiliateurl", "awdeeplink", "merchantdeeplink", "deeplink", "url", "basketlink"],
  afbeelding_url: ["afbeeldingurl", "merchantimageurl", "awimageurl", "largeimage", "afbeelding", "merchantthumburl"],
  ean:            ["ean", "productgtin", "gtin"],
  categorie_ruw:  ["categorie", "merchantcategory", "categoryname", "merchantproductcategorypath"],
};

export interface RuweFeedRij {
  naam: string;
  merk: string;
  prijs: string;
  affiliate_url: string;
  afbeelding_url: string;
  ean: string;
  categorie_ruw: string;
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
  // "aw product name" of kolommen met een extra prefix/suffix.
  for (const naam of mogelijkeNamen) {
    const genorm = normaliseer(naam);
    const idx = genormaliseerdeHeaders.findIndex((h) => h.includes(genorm) || genorm.includes(h));
    if (idx !== -1) return { index: idx, header: headers[idx] };
  }

  return { index: -1, header: null };
}

function rijenUitTabel(rows: unknown[][]): { rijen: RuweFeedRij[]; herkenning: KolomHerkenning[]; ruweHeaders: string[] } {
  if (rows.length < 2) return { rijen: [], herkenning: [], ruweHeaders: [] };
  const headers = rows[0].map((h) => String(h ?? ""));

  const velden = ["naam", "merk", "prijs", "affiliate_url", "afbeelding_url", "ean", "categorie_ruw"];
  const kolomIndex: Record<string, number> = {};
  const herkenning: KolomHerkenning[] = [];

  velden.forEach((veld) => {
    const { index, header } = vindKolom(headers, veld);
    kolomIndex[veld] = index;
    herkenning.push({ veld, gevondenHeader: header });
  });

  const resultaat: RuweFeedRij[] = [];
  for (let i = 1; i < rows.length; i++) {
    const rij = rows[i];
    if (!rij || rij.length === 0) continue;
    const lees = (idx: number) => (idx >= 0 && rij[idx] != null ? String(rij[idx]).trim() : "");
    resultaat.push({
      naam: lees(kolomIndex.naam),
      merk: lees(kolomIndex.merk),
      prijs: lees(kolomIndex.prijs),
      affiliate_url: lees(kolomIndex.affiliate_url),
      afbeelding_url: lees(kolomIndex.afbeelding_url),
      ean: lees(kolomIndex.ean),
      categorie_ruw: lees(kolomIndex.categorie_ruw),
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

// Meertalige trefwoorden om geslacht uit een productnaam te herkennen.
// Woordgrenzen zijn belangrijk: "men" mag niet matchen binnen "women".
const GESLACHT_TREFWOORDEN: { geslacht: "man" | "vrouw"; patroon: RegExp }[] = [
  { geslacht: "vrouw", patroon: /\b(women|woman|dames|damen|mujer|femme|female|ladies)\b/i },
  { geslacht: "man",   patroon: /\b(men|heren|herren|hombre|homme|male)\b/i },
];

/**
 * Probeert het geslacht (man/vrouw/unisex) uit een productnaam te
 * herkennen. Belangrijk: "vrouw" wordt eerst gecheckt, omdat "women"
 * anders per ongeluk zou matchen op het "men"-patroon.
 */
export function detecteerGeslacht(naam: string): "man" | "vrouw" | "unisex" {
  for (const { geslacht, patroon } of GESLACHT_TREFWOORDEN) {
    if (patroon.test(naam)) return geslacht;
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
  racket:       ["racket", "raquet", "raqueta", "pala", "paddle", "racquet"],
  schoenen:     ["schoen", "shoe", "zapatilla", "calzado", "footwear"],
  ballen:       ["bal", "ball", "bola", "pelota"],
  tassen:       ["tas", "bag", "bolsa", "mochila", "backpack"],
  kleding:      [
    "kleding", "cloth", "clothing", "apparel", "ropa", "camiseta", "textil",
    "shirt", "tshirt", "t-shirt",
    "short", "pant", "pantalon", "trouser",
    "jacket", "chaqueta",
    "sweat", "sweater", "sweatshirt", "hoodie", "hooded", "sudadera",
    "polo", "tank", "skirt", "falda", "dress", "vestido",
  ],
  accessoires:  ["accessoire", "accessory", "accesorio", "grip", "overgrip", "wristband", "muneca", "sock", "calcetin", "cap", "gorra"],
  voeding:      ["voeding", "nutrition", "suplemento", "protein", "proteina"],
  bescherming:  ["bescherming", "protection", "proteccion", "guard"],
};

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
const CATEGORIE_PRIORITEIT = ["tassen", "schoenen", "kleding", "ballen", "accessoires", "voeding", "bescherming", "racket"];

export function matchCategorie(
  ruweTekst: string,
  categorieen: { id: string; naam: string; slug: string }[],
  productNaam: string = ""
): string | null {
  const kandidaten = [ruweTekst, productNaam].filter(Boolean);

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
    // Nederlandse productnamen die toevallig geen Engels trefwoord bevatten)
    const directeMatch = gesorteerdeCategorieen.find(
      (c) => bevatAlsWoord(tekst, c.slug) || bevatAlsWoord(tekst, c.naam)
    );
    if (directeMatch) return directeMatch.id;
  }

  return null;
}
