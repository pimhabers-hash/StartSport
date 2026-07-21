"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseFeedBuffer, bepaalBudgetklasse, matchCategorie, type RuweFeedRij, type KolomHerkenning } from "@/lib/feed-import";


export default function ImportPage() {
  const supabase = createClient();

  const [sportId, setSportId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [sporten, setSporten] = useState<{ id: string; naam: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; naam: string }[]>([]);
  const [categorieen, setCategorieen] = useState<{ id: string; naam: string; slug: string }[]>([]);

  const [grensBudget, setGrensBudget] = useState("50");
  const [grensMidden, setGrensMidden] = useState("150");

  const [bestandsnaam, setBestandsnaam] = useState<string | null>(null);
  const [ruweRijen, setRuweRijen] = useState<RuweFeedRij[]>([]);
  const [herkenning, setHerkenning] = useState<KolomHerkenning[]>([]);
  const [scheidingsteken, setScheidingsteken] = useState<string | null>(null);
  const [categorieMapping, setCategorieMapping] = useState<Record<string, string>>({});
  const [analyseren, setAnalyseren] = useState(false);
  const [importeren, setImporteren] = useState(false);
  const [klaar, setKlaar] = useState<{ succes: number; fout: number; overgeslagen: number } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    async function laadOpties() {
      const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
        supabase.from("categories").select("id, naam, slug").order("volgorde"),
      ]);
      setSporten(s ?? []);
      setProviders(p ?? []);
      setCategorieen(c ?? []);
    }
    laadOpties();
  }, []);

  const uniekeCategorieen = Array.from(new Set(ruweRijen.map((r) => r.categorie_ruw).filter(Boolean)));

  async function handleBestandGekozen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBestandsnaam(file.name);
    setAnalyseren(true);
    setFout(null);
    setKlaar(null);

    try {
      const buffer = await file.arrayBuffer();
      const { rijen, herkenning: herk, ruweHeaders, scheidingsteken: gedetecteerd } = await parseFeedBuffer(buffer, file.name);
      setHerkenning(herk);
      setScheidingsteken(gedetecteerd ?? null);

      if (rijen.length === 0) {
        setFout(`Geen rijen gevonden. Kolomkoppen in bestand: ${ruweHeaders.join(", ") || "(geen headers gevonden)"}`);
        setAnalyseren(false);
        return;
      }

      const verplichteVelden = herk.filter((h) => ["naam", "prijs", "affiliate_url"].includes(h.veld));
      const nietGevonden = verplichteVelden.filter((h) => !h.gevondenHeader);
      if (nietGevonden.length > 0) {
        setFout(
          `Kon deze verplichte kolommen niet vinden: ${nietGevonden.map((h) => h.veld).join(", ")}. ` +
          `Ruwe kolomkoppen (tussen aanhalingstekens, zodat onzichtbare tekens zichtbaar worden): ` +
          ruweHeaders.map((h) => JSON.stringify(h)).join(", ")
        );
      }

      setRuweRijen(rijen);

      const nieuweMapping: Record<string, string> = {};
      const uniek = Array.from(new Set(rijen.map((r) => r.categorie_ruw).filter(Boolean)));
      uniek.forEach((ruw) => {
        const match = matchCategorie(ruw, categorieen);
        if (match) nieuweMapping[ruw] = match;
      });
      setCategorieMapping(nieuweMapping);
    } catch (err) {
      setFout(`Kon het bestand niet lezen: ${err instanceof Error ? err.message : "onbekende fout"}`);
    } finally {
      setAnalyseren(false);
    }
  }

  async function handleImporteren() {
    if (!sportId) { setFout("Kies eerst een sport."); return; }
    if (Object.keys(categorieMapping).length === 0 && uniekeCategorieen.length > 0) {
      setFout("Koppel eerst de categorieën hieronder.");
      return;
    }

    setImporteren(true);
    setFout(null);

    const { data: bestaandeProducten } = await supabase.from("products").select("id, naam, ean");
    const naamMap = new Map((bestaandeProducten ?? []).map((p) => [p.naam.toLowerCase().trim(), p.id]));
    const eanMap = new Map((bestaandeProducten ?? []).filter((p) => p.ean).map((p) => [p.ean, p.id]));

    let succes = 0, mislukt = 0, overgeslagen = 0;

    for (const rij of ruweRijen) {
      if (!rij.naam || !rij.prijs || !rij.affiliate_url) { mislukt++; continue; }
      const prijsGetal = parseFloat(rij.prijs.replace(",", "."));
      if (isNaN(prijsGetal)) { mislukt++; continue; }
      if (rij.categorie_ruw && !categorieMapping[rij.categorie_ruw]) { overgeslagen++; continue; }

      const bestaand_id = (rij.ean && eanMap.get(rij.ean)) ?? naamMap.get(rij.naam.toLowerCase().trim());
      const budgetklasse = bepaalBudgetklasse(prijsGetal, parseFloat(grensBudget), parseFloat(grensMidden));
      const category_id = rij.categorie_ruw ? categorieMapping[rij.categorie_ruw] : categorieen[0]?.id;

      if (bestaand_id) {
        const { error } = await supabase.from("products").update({
          prijs: prijsGetal,
          affiliate_url: rij.affiliate_url,
          afbeelding_url: rij.afbeelding_url || null,
        }).eq("id", bestaand_id);
        if (error) mislukt++; else succes++;
      } else {
        const { error } = await supabase.from("products").insert({
          naam: rij.naam,
          merk: rij.merk || null,
          sport_id: sportId,
          category_id,
          provider_id: providerId || null,
          prijs: prijsGetal,
          budgetklasse,
          affiliate_url: rij.affiliate_url,
          afbeelding_url: rij.afbeelding_url || null,
          ean: rij.ean || null,
          niveau: [],
          geschikt_voor_frequentie: [],
          score: 4.0,
          bron: "csv_import",
          geclassificeerd: false,
          actief: false,
        });
        if (error) mislukt++; else succes++;
      }
    }

    setKlaar({ succes, fout: mislukt, overgeslagen });
    setImporteren(false);
  }

  // Belangrijk: bereken de status over ALLE rijen, niet alleen de rijen
  // die in de preview-tabel zichtbaar zijn — anders kloppen de tellingen
  // niet bij grote bestanden (zoals een feed met 40.000+ producten).
  const alleRijenMetStatus = ruweRijen.map((r) => {
    const prijsGetal = parseFloat(r.prijs.replace(",", "."));
    const budgetklasse = isNaN(prijsGetal) ? null : bepaalBudgetklasse(prijsGetal, parseFloat(grensBudget), parseFloat(grensMidden));
    const heeftFout = !r.naam || !r.prijs || !r.affiliate_url || isNaN(prijsGetal);
    const overgeslagen = !!(r.categorie_ruw && !categorieMapping[r.categorie_ruw]) && !heeftFout;
    return { ...r, budgetklasse, heeftFout, overgeslagen };
  });

  const previewRijen = alleRijenMetStatus.slice(0, 200);
  const aantalGeldig = alleRijenMetStatus.filter((r) => !r.heeftFout && !r.overgeslagen).length;
  const aantalOvergeslagen = alleRijenMetStatus.filter((r) => r.overgeslagen).length;
  const aantalFout = alleRijenMetStatus.filter((r) => r.heeftFout).length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/producten" className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</Link>
        <h1 className="font-display text-3xl text-brand-ivory">CSV / Affiliate feed import</h1>
      </div>

      {klaar ? (
        <div className="card-surface rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">✓</p>
          <p className="text-brand-ivory font-display text-lg mb-1">{klaar.succes} producten verwerkt</p>
          <p className="text-brand-muted text-sm font-mono">
            {klaar.overgeslagen > 0 && `${klaar.overgeslagen} overgeslagen (niet-gekoppelde categorie) · `}
            {klaar.fout > 0 && `${klaar.fout} mislukt`}
          </p>
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
          <div className="card-surface rounded-2xl p-6 mb-6 space-y-4">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">1. Voor welke sport en aanbieder is deze feed?</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Sport</label>
                <select value={sportId} onChange={(e) => setSportId(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold">
                  <option value="">— Kies sport —</option>
                  {sporten.map((s) => <option key={s.id} value={s.id}>{s.naam}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Aanbieder</label>
                <select value={providerId} onChange={(e) => setProviderId(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold">
                  <option value="">— Kies aanbieder —</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.naam}</option>)}
                </select>
              </div>
            </div>

            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest pt-2">2. Prijsgrenzen voor budgetklasse</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-muted text-xs font-mono mb-2">Onder dit bedrag = Budget</label>
                <input type="number" value={grensBudget} onChange={(e) => setGrensBudget(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-mono mb-2">Onder dit bedrag = Middenklasse (erboven = Premium)</label>
                <input type="number" value={grensMidden} onChange={(e) => setGrensMidden(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold" />
              </div>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-8 mb-6">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest mb-4">3. Upload de feed (CSV, komma-gescheiden)</p>
            <label className="block">
              <div className="border-2 border-dashed border-brand-border rounded-xl p-12 text-center cursor-pointer hover:border-brand-gold/40 transition-colors">
                <p className="text-3xl mb-3">📄</p>
                <p className="text-brand-ivory font-body mb-1">{bestandsnaam ?? "Klik om je Awin/Daisycon export te kiezen (CSV of Excel)"}</p>
                <p className="text-brand-muted text-xs font-mono">Awin- en eigen kolomnamen worden automatisch herkend</p>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBestandGekozen} className="hidden" />
              </div>
            </label>
          </div>

          {analyseren && <p className="text-brand-muted text-sm font-mono animate-pulse mb-4">Bestand analyseren...</p>}
          {fout && <p className="text-red-400 text-sm font-mono mb-4">{fout}</p>}

          {herkenning.length > 0 && (
            <div className="card-surface rounded-2xl p-6 mb-6">
              <p className="text-brand-gold text-xs font-mono uppercase tracking-widest mb-1">Kolomherkenning</p>
              {scheidingsteken && (
                <p className="text-brand-muted text-xs font-mono mb-3">Herkend scheidingsteken: <span className="text-brand-ivory">{scheidingsteken}</span></p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {herkenning.map((h) => (
                  <div key={h.veld} className={`px-3 py-2 rounded-lg text-xs font-mono ${
                    h.gevondenHeader ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    <p className="opacity-70">{h.veld}</p>
                    <p className="truncate">{h.gevondenHeader ?? "niet gevonden"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uniekeCategorieen.length > 0 && (
            <div className="card-surface rounded-2xl p-6 mb-6">
              <p className="text-brand-gold text-xs font-mono uppercase tracking-widest mb-1">4. Koppel de categorieën uit de feed</p>
              <p className="text-brand-muted text-xs font-body mb-4">
                Producten met een categorie die je niet koppelt, worden overgeslagen bij import.
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {uniekeCategorieen.map((ruw) => (
                  <div key={ruw} className="flex items-center gap-3">
                    <span className="flex-1 text-brand-ivory text-sm font-mono truncate">{ruw}</span>
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-brand-muted flex-shrink-0"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2"/></svg>
                    <select
                      value={categorieMapping[ruw] ?? ""}
                      onChange={(e) => setCategorieMapping((m) => ({ ...m, [ruw]: e.target.value }))}
                      className="w-56 bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-brand-ivory text-xs focus:outline-none focus:border-brand-gold flex-shrink-0"
                    >
                      <option value="">— Overslaan —</option>
                      {categorieen.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewRijen.length > 0 && (
            <>
              <div className="flex gap-3 mb-4">
                <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-mono">{aantalGeldig} geldig</span>
                {aantalOvergeslagen > 0 && <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono">{aantalOvergeslagen} overgeslagen</span>}
                {aantalFout > 0 && <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-mono">{aantalFout} fout</span>}
                <span className="px-3 py-1.5 rounded-lg bg-brand-surface text-brand-muted text-xs font-mono">{ruweRijen.length} totaal in bestand</span>
              </div>

              <div className="card-surface rounded-2xl overflow-hidden mb-6 max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-brand-card">
                    <tr className="border-b border-brand-border">
                      {["Status", "Naam", "Prijs", "Budget", "Categorie"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-brand-muted font-mono uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRijen.map((rij, i) => (
                      <tr key={i} className="border-b border-brand-border/50">
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                            rij.heeftFout ? "bg-red-500/10 text-red-400" :
                            rij.overgeslagen ? "bg-amber-500/10 text-amber-400" :
                            "bg-green-500/10 text-green-400"
                          }`}>
                            {rij.heeftFout ? "fout" : rij.overgeslagen ? "overgeslagen" : "ok"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-ivory truncate max-w-xs">{rij.naam || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-gold font-mono">{rij.prijs || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-muted font-mono">{rij.budgetklasse ?? "—"}</td>
                        <td className="px-4 py-2.5 text-brand-muted font-mono truncate max-w-[160px]">{rij.categorie_ruw || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ruweRijen.length > 200 && (
                  <p className="text-brand-muted text-xs font-mono px-4 py-3">
                    Preview toont eerste 200 van {ruweRijen.length} rijen — bij import worden alle rijen verwerkt.
                  </p>
                )}
              </div>

              <button
                onClick={handleImporteren}
                disabled={importeren || aantalGeldig === 0}
                className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40"
              >
                {importeren ? "Importeren... dit kan even duren bij grote feeds" : `${aantalGeldig} producten importeren`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
