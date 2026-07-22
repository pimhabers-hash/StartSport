"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  naam: string;
  merk: string | null;
  prijs: number;
  budgetklasse: string;
  actief: boolean;
  geclassificeerd: boolean;
  sport_naam: string;
  categorie_naam: string;
}

const NIVEAUS = [
  { waarde: "beginner", label: "Beginner" },
  { waarde: "gemiddeld", label: "Gemiddeld" },
  { waarde: "gevorderd", label: "Gevorderd" },
  { waarde: "competitie", label: "Competitie" },
];

const FREQUENTIES = [
  { waarde: "recreatief", label: "Recreatief" },
  { waarde: "wekelijks", label: "Wekelijks" },
  { waarde: "intensief", label: "Intensief" },
];

const BUDGET_LABEL: Record<string, string> = {
  budget: "Budget", middenklasse: "Midden", premium: "Premium",
};

export default function ProductenPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  const [producten, setProducten] = useState<Product[]>([]);
  const [laden, setLaden] = useState(true);
  const [aantalNietGeclassificeerd, setAantalNietGeclassificeerd] = useState(0);

  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());
  const [bulkNiveaus, setBulkNiveaus] = useState<string[]>([]);
  const [bulkFrequenties, setBulkFrequenties] = useState<string[]>([]);
  const [bulkOpslaan, setBulkOpslaan] = useState(false);
  const [bulkMelding, setBulkMelding] = useState<string | null>(null);

  async function laad() {
    setLaden(true);
    let query = supabase
      .from("products")
      .select(`
        id, naam, merk, prijs, budgetklasse, actief, geclassificeerd,
        sports ( naam ), categories ( naam )
      `)
      .order("created_at", { ascending: false });

    if (filter === "niet_geclassificeerd") query = query.eq("geclassificeerd", false);

    const { data } = await query;
    const verwerkt: Product[] = (data ?? []).map((p) => ({
      id: p.id,
      naam: p.naam,
      merk: p.merk,
      prijs: Number(p.prijs),
      budgetklasse: p.budgetklasse,
      actief: p.actief,
      geclassificeerd: p.geclassificeerd,
      sport_naam: Array.isArray(p.sports) ? p.sports[0]?.naam ?? "—" : (p.sports as { naam: string } | null)?.naam ?? "—",
      categorie_naam: Array.isArray(p.categories) ? p.categories[0]?.naam ?? "—" : (p.categories as { naam: string } | null)?.naam ?? "—",
    }));
    setProducten(verwerkt);

    const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("geclassificeerd", false);
    setAantalNietGeclassificeerd(count ?? 0);
    setLaden(false);
    setGeselecteerd(new Set());
  }

  useEffect(() => { laad(); }, [filter]);

  function toggleSelectie(id: string) {
    setGeselecteerd((prev) => {
      const nieuw = new Set(prev);
      if (nieuw.has(id)) nieuw.delete(id); else nieuw.add(id);
      return nieuw;
    });
  }

  function toggleAlles() {
    setGeselecteerd((prev) =>
      prev.size === producten.length ? new Set() : new Set(producten.map((p) => p.id))
    );
  }

  function toggleBulkNiveau(w: string) {
    setBulkNiveaus((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }
  function toggleBulkFrequentie(w: string) {
    setBulkFrequenties((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }

  async function handleBulkToepassen() {
    if (geselecteerd.size === 0) return;
    if (bulkNiveaus.length === 0 || bulkFrequenties.length === 0) {
      setBulkMelding("Kies minimaal één niveau en één frequentie.");
      return;
    }
    setBulkOpslaan(true);
    setBulkMelding(null);

    const { error } = await supabase
      .from("products")
      .update({
        niveau: bulkNiveaus,
        geschikt_voor_frequentie: bulkFrequenties,
        geclassificeerd: true,
        actief: true,
      })
      .in("id", Array.from(geselecteerd));

    if (error) {
      setBulkMelding(`Fout: ${error.message}`);
    } else {
      setBulkMelding(`${geselecteerd.size} producten geclassificeerd en geactiveerd.`);
      setBulkNiveaus([]);
      setBulkFrequenties([]);
      await laad();
    }
    setBulkOpslaan(false);
  }

  const alleGeselecteerd = producten.length > 0 && geselecteerd.size === producten.length;

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-brand-ivory mb-1">Producten</h1>
          <p className="text-brand-muted text-sm font-body">
            {producten.length} producten {filter === "niet_geclassificeerd" && "(niet geclassificeerd)"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/producten/snel-toevoegen" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-gold/40 text-brand-gold text-sm font-medium hover:bg-brand-gold/5 transition-colors">
            ⚡ Snel toevoegen
          </Link>
          <Link href="/admin/producten/import" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-gold/40 text-brand-gold text-sm font-medium hover:bg-brand-gold/5 transition-colors">
            📄 CSV Import
          </Link>
          <Link href="/admin/producten/nieuw" className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
            ＋ Product toevoegen
          </Link>
        </div>
      </div>

      {aantalNietGeclassificeerd > 0 && filter !== "niet_geclassificeerd" && (
        <Link
          href="/admin/producten?filter=niet_geclassificeerd"
          className="flex items-center justify-between mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors"
        >
          <span className="text-amber-400 text-sm font-body">
            ⚠️ {aantalNietGeclassificeerd} producten wachten nog op classificatie en staan daardoor niet zichtbaar in de configurator.
          </span>
          <span className="text-amber-400 text-xs font-mono">Bekijk →</span>
        </Link>
      )}

      {filter === "niet_geclassificeerd" && (
        <Link href="/admin/producten" className="inline-block mb-4 text-brand-muted text-xs font-mono hover:text-brand-ivory">
          ← Alle producten tonen
        </Link>
      )}

      {/* Bulk-actiebalk — verschijnt zodra er iets geselecteerd is */}
      {geselecteerd.size > 0 && (
        <div className="card-surface rounded-2xl p-6 mb-6 border-brand-gold/30">
          <p className="text-brand-gold text-sm font-body mb-4">
            {geselecteerd.size} product{geselecteerd.size !== 1 ? "en" : ""} geselecteerd — ken in één keer niveau en frequentie toe:
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-4">
            <div>
              <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Niveau</p>
              <div className="flex flex-wrap gap-2">
                {NIVEAUS.map((n) => (
                  <button key={n.waarde} onClick={() => toggleBulkNiveau(n.waarde)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      bulkNiveaus.includes(n.waarde) ? "border-brand-gold bg-brand-gold/10 text-brand-gold" : "border-brand-border text-brand-muted"
                    }`}>
                    {bulkNiveaus.includes(n.waarde) && "✓ "}{n.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Frequentie</p>
              <div className="flex flex-wrap gap-2">
                {FREQUENTIES.map((f) => (
                  <button key={f.waarde} onClick={() => toggleBulkFrequentie(f.waarde)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      bulkFrequenties.includes(f.waarde) ? "border-brand-gold bg-brand-gold/10 text-brand-gold" : "border-brand-border text-brand-muted"
                    }`}>
                    {bulkFrequenties.includes(f.waarde) && "✓ "}{f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {bulkMelding && <p className="text-sm font-mono mb-3 text-brand-muted">{bulkMelding}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleBulkToepassen}
              disabled={bulkOpslaan}
              className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium disabled:opacity-40"
            >
              {bulkOpslaan ? "Bezig..." : `Toepassen op ${geselecteerd.size} producten`}
            </button>
            <button onClick={() => setGeselecteerd(new Set())} className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm">
              Selectie wissen
            </button>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="w-10 px-5 py-3">
                <input type="checkbox" checked={alleGeselecteerd} onChange={toggleAlles} className="w-4 h-4 accent-[#C6A15B]" />
              </th>
              {["Product", "Sport", "Categorie", "Budget", "Prijs", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {producten.map((product) => (
              <tr key={product.id} className={`border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors ${geselecteerd.has(product.id) ? "bg-brand-gold/5" : ""}`}>
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={geselecteerd.has(product.id)}
                    onChange={() => toggleSelectie(product.id)}
                    className="w-4 h-4 accent-[#C6A15B]"
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <p className="text-brand-ivory font-body">{product.naam}</p>
                    {!product.geclassificeerd && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">TE CLASSIFICEREN</span>
                    )}
                  </div>
                  {product.merk && <p className="text-brand-muted text-xs font-mono">{product.merk}</p>}
                </td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">{product.sport_naam}</td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">{product.categorie_naam}</td>
                <td className="px-5 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono border border-brand-border text-brand-muted">
                    {BUDGET_LABEL[product.budgetklasse]}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-brand-gold">€{product.prijs.toFixed(2).replace(".", ",")}</td>
                <td className="px-5 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block ${product.actief ? "bg-green-500" : "bg-red-500/50"}`} />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/admin/producten/${product.id}`} className="text-brand-muted text-xs font-mono hover:text-brand-gold transition-colors">
                    Bewerk →
                  </Link>
                </td>
              </tr>
            ))}
            {producten.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-brand-muted font-mono text-sm">Geen producten gevonden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
