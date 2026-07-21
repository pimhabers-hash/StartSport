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

// Normaliseert een kolomnaam voor vergelijking: alles lowercase,
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
}

/**
 * Verwerkt een feed-bestand (CSV of Excel) tot een uniforme rijenlijst,
 * plus diagnose-informatie over welke kolommen wel/niet herkend zijn.
 */
export function parseFeedBuffer(buffer: ArrayBuffer, bestandsnaam: string): ParseFeedResultaat {
  const isExcel = /\.xlsx?$/i.test(bestandsnaam);

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: "array" });
    const eersteSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(eersteSheet, { header: 1, raw: false });
    return rijenUitTabel(rows);
  }

  const tekst = new TextDecoder("utf-8").decode(buffer);
  const workbook = XLSX.read(tekst, { type: "string" });
  const eersteSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(eersteSheet, { header: 1, raw: false });
  return rijenUitTabel(rows);
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

export function matchCategorie(
  ruweTekst: string,
  categorieen: { id: string; naam: string; slug: string }[]
): string | null {
  const laag = ruweTekst.toLowerCase();
  const gevonden = categorieen.find(
    (c) => laag.includes(c.slug) || laag.includes(c.naam.toLowerCase())
  );
  return gevonden?.id ?? null;
}
