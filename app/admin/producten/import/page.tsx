"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────

interface CsvRij {
  naam: string;
  merk: string;
  prijs: string;
  sport_slug: string;
  categorie_slug: string;
  provider_slug: string;
  affiliate_url: string;
  afbeelding_url: string;
  ean: string;
  budgetklasse: string;
}

interface VerwerkteRij extends CsvRij {
  status: "nieuw" | "update" | "fout";
  foutmelding?: string;
  bestaand_id?: string;
}

// ─── CSV parsing (lichtgewicht, geen externe library nodig) ──

function parseCsv(tekst: string): CsvRij[] {
  const regels = tekst.trim().split("\n").filter((r) => r.trim());
  if (regels.length < 2) return [];

  const headers = regels[0].split(",").map((h) => h.trim().toLowerCase());
  const rijen: CsvRij[] = [];

  for (let i = 1; i < regels.length; i++) {
    // Simpele CSV-parsing die rekening houdt met quotes
    const waarden: string[] = [];
    let huidig = "";
    let inQuotes = false;
    for (const char of regels[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        waarden.push(huidig.trim());
        huidig = "";
      } else {
        huidig += char;
      }
    }
    waarden.push(huidig.trim());

    const rij: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rij[h] = waarden[idx] ?? "";
    });

    rijen.push({
      naam: rij.naam ?? "",
      merk: rij.merk ?? "",
      prijs: rij.prijs ?? "",
      sport_slug: rij.sport ?? rij.sport_slug ?? "",
      categorie_slug: rij.categorie ?? rij.categorie_slug ?? "",
      provider_slug: rij.provider ?? rij.aanbieder ?? "",
      affiliate_url: rij.affiliate_url ?? rij.url ?? "",
      afbeelding_url: rij.afbeelding_url ?? rij.afbeelding ?? "",
      ean: rij.ean ?? "",
      budgetklasse: rij.budgetklasse ?? rij.budget ?? "budget",
    });
  }

  return rijen;
}

// ─── Component ────────────────────────────────────────────────

export default function ImportPage() {
  const supabase = createClient();
  const router = useRouter();

  const [bestandsnaam, setBestandsnaam] = useState<string | null>(null);
  const [verwerkteRijen, setVerwerkteRijen] = useState<VerwerkteRij[]>([]);
  const [analyseren, setAnalyseren] = useState(false);
  const [importeren, setImporteren] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function handleBestandGekozen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBestandsnaam(file.name);
    setAnalyseren(true);
    setFout(null);
    setKlaar(false);

    try {
      const tekst = await file.text();
      const rijen = parseCsv(tekst);

      if (rijen.length === 0) {
        setFout("Geen geldige rijen gevonden. Check of de CSV de juiste kolommen heeft.");
        setAnalyseren(false);
        return;
      }

      // Haal bestaande producten op om te matchen (op naam, case-insensitive)
      const { data: bestaandeProducten } = await supabase
        .from("products")
        .select("id, naam, ean");

      const naamMap = new Map(
        (bestaandeProducten ?? []).map((p) => [p.naam.toLowerCase().trim(), p.id])
      );
      const eanMap = new Map(
        (bestaandeProducten ?? [])
          .filter((p) => p.ean)
          .map((p) => [p.ean, p.id])
      );

      const verwerkt: VerwerkteRij[] = rijen.map((rij) => {
        // Validatie
        if (!rij.naam || !rij.prijs || !rij.sport_slug || !rij.categorie_slug || !rij.affiliate_url) {
          return {
            ...rij,
            status: "fout",
            foutmelding: "Verplichte velden ontbreken (naam, prijs, sport, categorie, affiliate_url)",
          };
        }
        if (isNaN(parseFloat(rij.prijs))) {
          return { ...rij, status: "fout", foutmelding: "Prijs is geen geldig getal" };
        }

        // Matching: eerst op EAN, dan op naam
        const bestaandViaEan = rij.ean ? eanMap.get(rij.ean) : undefined;
        const bestaandViaNaam = naamMap.get(rij.naam.toLowerCase().trim());
        const bestaand_id = bestaandViaEan ?? bestaandViaNaam;

        return {
          ...rij,
          status: bestaand_id ? "update" : "nieuw",
          bestaand_id,
        };
      });

      setVerwerkteRijen(verwerkt);
    } catch {
      setFout("Kon het bestand niet lezen. Check of het een geldig CSV-bestand is.");
    } finally {
      setAnalyseren(false);
    }
  }

  async function handleImporteren() {
    setImporteren(true);
    setFout(null);

    try {
      // Lookup-tabellen voor sport/categorie/provider slugs → id's
      const [{ data: sporten }, { data: categorieen }, { data: providers }] = await Promise.all([
        supabase.from("sports").select("id, slug"),
        supabase.from("categories").select("id, slug"),
        supabase.from("providers").select("id, slug"),
      ]);

      const sportMap = new Map((sporten ?? []).map((s) => [s.slug, s.id]));
      const categorieMap = new Map((categorieen ?? []).map((c) => [c.slug, c.id]));
      const providerMap = new Map((providers ?? []).map((p) => [p.slug, p.id]));

      let succesTeller = 0;
      let foutTeller = 0;

      for (const rij of verwerkteRijen) {
        if (rij.status === "fout") { foutTeller++; continue; }

        const sport_id = sportMap.get(rij.sport_slug);
        const category_id = categorieMap.get(rij.categorie_slug);
        const provider_id = providerMap.get(rij.provider_slug);

        if (!sport_id || !category_id) {
          foutTeller++;
          continue;
        }

        const productData = {
          naam: rij.naam,
          merk: rij.merk || null,
          sport_id,
          category_id,
          provider_id: provider_id ?? null,
          prijs: parseFloat(rij.prijs),
          budgetklasse: (["budget", "middenklasse", "premium"].includes(rij.budgetklasse)
            ? rij.budgetklasse
            : "budget") as "budget" | "middenklasse" | "premium",
          affiliate_url: rij.affiliate_url,
          afbeelding_url: rij.afbeelding_url || null,
          ean: rij.ean || null,
          bron: "csv_import",
        };

        if (rij.status === "update" && rij.bestaand_id) {
          // Update: alleen prijs, URL en afbeelding — classificatie (niveau etc.) blijft ongemoeid
          const { error } = await supabase
            .from("products")
            .update({
              prijs: productData.prijs,
              affiliate_url: productData.affiliate_url,
              afbeelding_url: productData.afbeelding_url,
            })
            .eq("id", rij.bestaand_id);
          if (error) foutTeller++; else succesTeller++;
        } else {
          // Nieuw: toevoegen als niet-geclassificeerd, admin moet niveau nog instellen
          const { error } = await supabase.from("products").insert({
            ...productData,
            niveau: [],
            geschikt_voor_frequentie: [],
            geclassificeerd: false,
            actief: false, // pas actief zodra geclassificeerd, zodat er geen halve matches ontstaan
          });
          if (error) foutTeller++; else succesTeller++;
        }
      }

      setKlaar(true);
      if (foutTeller > 0) {
        setFout(`${succesTeller} producten verwerkt, ${foutTeller} mislukt (check sport/categorie-slugs).`);
      }
    } catch {
      setFout("Er ging iets mis tijdens het importeren.");
    } finally {
      setImporteren(false);
    }
  }

  const aantalNieuw = verwerkteRijen.filter((r) => r.status === "nieuw").length;
  const aantalUpdate = verwerkteRijen.filter((r) => r.status === "update").length;
  const aantalFout = verwerkteRijen.filter((r) => r.status === "fout").length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/producten" className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</Link>
        <h1 className="font-display text-3xl text-brand-ivory">CSV Import</h1>
      </div>

      {klaar ? (
        <div className="card-surface rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">✓</p>
          <h2 className="font-display text-xl text-brand-ivory mb-2">Import voltooid</h2>
          <p className="text-brand-muted text-sm mb-2">
            {aantalNieuw} nieuwe producten toegevoegd (nog te classificeren),{" "}
            {aantalUpdate} bestaande producten bijgewerkt.
          </p>
          {fout && <p className="text-amber-400 text-sm font-mono mb-6">{fout}</p>}
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/admin/producten?filter=niet_geclassificeerd" className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
              Nieuwe producten classificeren →
            </Link>
            <Link href="/admin/producten" className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm">
              Naar productoverzicht
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Uitleg */}
          <div className="card-surface rounded-2xl p-6 mb-6">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest mb-3">Verwachte CSV-kolommen</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["naam*", "merk", "prijs*", "sport*", "categorie*", "provider", "affiliate_url*", "afbeelding_url", "ean", "budgetklasse"].map((k) => (
                <code key={k} className="px-2 py-1 rounded bg-brand-surface text-brand-muted text-xs font-mono">{k}</code>
              ))}
            </div>
            <p className="text-brand-muted text-xs font-body">
              * verplicht. <code className="text-brand-gold">sport</code>, <code className="text-brand-gold">categorie</code> en{" "}
              <code className="text-brand-gold">provider</code> moeten overeenkomen met bestaande slugs (bijv. <code className="text-brand-gold">padel</code>, <code className="text-brand-gold">racket</code>, <code className="text-brand-gold">decathlon</code>).
              Producten worden gematcht op EAN of exacte naam — bestaande producten krijgen alleen een prijs/link-update,
              nieuwe producten moet je na import nog classificeren (niveau, frequentie).
            </p>
          </div>

          {/* Upload */}
          <div className="card-surface rounded-2xl p-8 mb-6">
            <label className="block">
              <div className="border-2 border-dashed border-brand-border rounded-xl p-12 text-center cursor-pointer hover:border-brand-gold/40 transition-colors">
                <p className="text-3xl mb-3">📄</p>
                <p className="text-brand-ivory font-body mb-1">
                  {bestandsnaam ?? "Klik om een CSV-bestand te kiezen"}
                </p>
                <p className="text-brand-muted text-xs font-mono">of sleep het bestand hierheen</p>
                <input type="file" accept=".csv" onChange={handleBestandGekozen} className="hidden" />
              </div>
            </label>
          </div>

          {analyseren && (
            <p className="text-brand-muted text-sm font-mono animate-pulse">Bestand analyseren...</p>
          )}

          {fout && (
            <p className="text-red-400 text-sm font-mono mb-4">{fout}</p>
          )}

          {/* Preview */}
          {verwerkteRijen.length > 0 && (
            <>
              <div className="flex gap-4 mb-4">
                <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-mono">
                  {aantalNieuw} nieuw
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono">
                  {aantalUpdate} update
                </span>
                {aantalFout > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-mono">
                    {aantalFout} fout
                  </span>
                )}
              </div>

              <div className="card-surface rounded-2xl overflow-hidden mb-6 max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-brand-card">
                    <tr className="border-b border-brand-border">
                      {["Status", "Naam", "Prijs", "Sport", "Categorie"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-brand-muted font-mono uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {verwerkteRijen.map((rij, i) => (
                      <tr key={i} className="border-b border-brand-border/50">
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                            rij.status === "nieuw" ? "bg-green-500/10 text-green-400" :
                            rij.status === "update" ? "bg-blue-500/10 text-blue-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>
                            {rij.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-ivory">{rij.naam || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-gold font-mono">€{rij.prijs || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-muted font-mono">{rij.sport_slug || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-muted font-mono">
                          {rij.foutmelding ? <span className="text-red-400">{rij.foutmelding}</span> : rij.categorie_slug}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImporteren}
                disabled={importeren || (aantalNieuw + aantalUpdate === 0)}
                className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40"
              >
                {importeren ? "Importeren..." : `${aantalNieuw + aantalUpdate} producten importeren`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
