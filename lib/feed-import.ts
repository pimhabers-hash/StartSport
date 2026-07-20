import * as XLSX from "xlsx";

// ─── Kolom-aliassen: herkent zowel onze eigen kolomnamen als die van
// Awin/Daisycon-feeds (CSV of Excel), zodat een ruwe partnerfeed direct
// bruikbaar is zonder handmatige bewerking vooraf.
const ALIASSEN: Record<string, string[]> = {
  naam:           ["naam", "product_name", "productnaam", "title"],
  merk:           ["merk", "brand_name", "brand"],
  prijs:          ["prijs", "search_price", "display_price", "store_price", "price"],
  affiliate_url:  ["affiliate_url", "aw_deep_link", "merchant_deep_link", "deeplink", "url"],
  afbeelding_url: ["afbeelding_url", "merchant_image_url", "aw_image_url", "large_image", "afbeelding"],
  ean:            ["ean", "product_gtin", "gtin"],
  categorie_ruw:  ["categorie", "merchant_category", "category_name", "merchant_product_category_path"],
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

function vindKolom(headers: string[], veld: string): number {
  const mogelijkeNamen = ALIASSEN[veld] ?? [veld];
  for (const naam of mogelijkeNamen) {
    const idx = headers.findIndex((h) => String(h).toLowerCase().trim() === naam.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function rijenUitTabel(rows: unknown[][]): RuweFeedRij[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h ?? ""));

  const kolomIndex = {
    naam: vindKolom(headers, "naam"),
    merk: vindKolom(headers, "merk"),
    prijs: vindKolom(headers, "prijs"),
    affiliate_url: vindKolom(headers, "affiliate_url"),
    afbeelding_url: vindKolom(headers, "afbeelding_url"),
    ean: vindKolom(headers, "ean"),
    categorie_ruw: vindKolom(headers, "categorie_ruw"),
  };

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
  return resultaat;
}

/**
 * Verwerkt een feed-bestand (CSV of Excel) tot een uniforme rijenlijst.
 * Werkt zowel in de browser (File → ArrayBuffer) als server-side
 * (fetch response → ArrayBuffer), omdat SheetJS in beide omgevingen werkt.
 */
export function parseFeedBuffer(buffer: ArrayBuffer, bestandsnaam: string): RuweFeedRij[] {
  const isExcel = /\.xlsx?$/i.test(bestandsnaam);

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: "array" });
    const eersteSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(eersteSheet, { header: 1, raw: false });
    return rijenUitTabel(rows);
  }

  // CSV: SheetJS kan ook platte tekst parsen, robuuster dan handmatig splitsen
  // (handelt quotes en verschillende regeleindes correct af).
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

/**
 * Probeert een ruwe categorietekst uit een feed automatisch te koppelen
 * aan een van onze eigen categorieën, op basis van sleutelwoord-match.
 */
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
