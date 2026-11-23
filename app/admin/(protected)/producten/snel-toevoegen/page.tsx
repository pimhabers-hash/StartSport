"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

type Optie = { label: string; waarde: string };

interface GeparsteRegel {
  naam: string;
  prijs: string;
  affiliate_url: string;
  afbeelding_url: string;
  status: "ok" | "fout";
  foutmelding?: string;
}

export default function SnelToevoegenPage() {
  const supabase = createClient();
  const router = useRouter();

  // Vaste velden — gelden voor alle regels in deze batch
  const [sportId, setSportId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [budgetklasse, setBudgetklasse] = useState("budget");
  const [niveaus, setNiveaus] = useState<string[]>([]);
  const [frequenties, setFrequenties] = useState<string[]>([]);

  const [sporten, setSporten] = useState<Optie[]>([]);
  const [categorieen, setCategorieen] = useState<Optie[]>([]);
  const [providers, setProviders] = useState<Optie[]>([]);

  const [tekst, setTekst] = useState("");
  const [opslaan, setOpslaan] = useState(false);
  const [klaar, setKlaar] = useState<{ succes: number; fout: number } | null>(null);

  useEffect(() => {
    async function laadOpties() {
      const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("categories").select("id, naam").order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
      ]);
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setCategorieen((c ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setProviders((p ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
    }
    laadOpties();
  }, []);

  function toggleNiveau(w: string) {
    setNiveaus((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }
  function toggleFrequentie(w: string) {
    setFrequenties((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }

  function parseTekst(): GeparsteRegel[] {
    return tekst
      .trim()
      .split("\n")
      .filter((r) => r.trim())
      .map((regel) => {
        const delen = regel.split(";").map((d) => d.trim());
        const [naam, prijs, affiliate_url, afbeelding_url] = delen;

        if (!naam || !prijs || !affiliate_url) {
          return {
            naam: naam ?? "",
            prijs: prijs ?? "",
            affiliate_url: affiliate_url ?? "",
            afbeelding_url: afbeelding_url ?? "",
            status: "fout" as const,
            foutmelding: "Verwacht minimaal: naam;prijs;affiliate_url",
          };
        }
        if (isNaN(parseFloat(prijs))) {
          return { naam, prijs, affiliate_url, afbeelding_url: afbeelding_url ?? "", status: "fout" as const, foutmelding: "Prijs is geen getal" };
        }
        return { naam, prijs, affiliate_url, afbeelding_url: afbeelding_url ?? "", status: "ok" as const };
      });
  }

  const geparsteRegels = tekst.trim() ? parseTekst() : [];
  const aantalOk = geparsteRegels.filter((r) => r.status === "ok").length;
  const aantalFout = geparsteRegels.filter((r) => r.status === "fout").length;

  async function handleOpslaan() {
    if (!sportId || !categoryId) {
      alert("Kies eerst een sport en categorie — die gelden voor alle producten in deze batch.");
      return;
    }
    setOpslaan(true);
    let succes = 0, fout = 0;

    for (const regel of geparsteRegels) {
      if (regel.status === "fout") { fout++; continue; }
      const { error } = await supabase.from("products").insert({
        naam: regel.naam,
        sport_id: sportId,
        category_id: categoryId,
        provider_id: providerId || null,
        prijs: parseFloat(regel.prijs),
        budgetklasse: budgetklasse as "budget" | "middenklasse" | "premium",
        niveau: niveaus as ("beginner" | "gemiddeld" | "gevorderd" | "competitie")[],
        geschikt_voor_frequentie: frequenties as ("recreatief" | "wekelijks" | "intensief")[],
        affiliate_url: regel.affiliate_url,
        afbeelding_url: regel.afbeelding_url || null,
        score: 4.0,
        actief: true,
      });
      if (error) fout++; else succes++;
    }

    setKlaar({ succes, fout });
    setOpslaan(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/producten" className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</Link>
        <h1 className="font-display text-3xl text-brand-ivory">Snel meerdere producten toevoegen</h1>
      </div>

      {klaar ? (
        <div className="card-surface rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">✓</p>
          <p className="text-brand-ivory font-display text-lg mb-1">{klaar.succes} producten toegevoegd</p>
          {klaar.fout > 0 && <p className="text-amber-400 text-sm font-mono">{klaar.fout} regels overgeslagen (fouten)</p>}
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/admin/producten" className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
              Naar productoverzicht
            </Link>
            <button onClick={() => { setKlaar(null); setTekst(""); }} className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm">
              Nog een batch toevoegen
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-surface rounded-2xl p-6 mb-6 space-y-5">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">
              Gedeelde instellingen voor deze batch
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormVeld label="Sport" naam="sport" type="select" verplicht waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
              <FormVeld label="Categorie" naam="categorie" type="select" verplicht waarde={categoryId} onChange={(v) => setCategoryId(v as string)} opties={categorieen} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormVeld label="Aanbieder" naam="provider" type="select" waarde={providerId} onChange={(v) => setProviderId(v as string)} opties={providers} />
              <FormVeld
                label="Budgetklasse"
                naam="budget"
                type="select"
                waarde={budgetklasse}
                onChange={(v) => setBudgetklasse(v as string)}
                opties={[{ label: "Budget", waarde: "budget" }, { label: "Middenklasse", waarde: "middenklasse" }, { label: "Premium", waarde: "premium" }]}
              />
            </div>

            <div>
              <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">Geschikt voor niveau(s)</p>
              <div className="flex flex-wrap gap-2">
                {["beginner", "gemiddeld", "gevorderd", "competitie"].map((n) => (
                  <button key={n} type="button" onClick={() => toggleNiveau(n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border capitalize transition-all ${
                      niveaus.includes(n) ? "border-brand-gold bg-brand-gold/10 text-brand-gold" : "border-brand-border text-brand-muted"
                    }`}>
                    {niveaus.includes(n) && "✓ "}{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">Geschikt voor frequentie(s)</p>
              <div className="flex flex-wrap gap-2">
                {["recreatief", "wekelijks", "intensief"].map((f) => (
                  <button key={f} type="button" onClick={() => toggleFrequentie(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border capitalize transition-all ${
                      frequenties.includes(f) ? "border-brand-gold bg-brand-gold/10 text-brand-gold" : "border-brand-border text-brand-muted"
                    }`}>
                    {frequenties.includes(f) && "✓ "}{f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-6 mb-6">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest mb-3">
              Producten (één per regel)
            </p>
            <p className="text-brand-muted text-xs font-body mb-3">
              Formaat: <code className="text-brand-gold">naam;prijs;affiliate_url;afbeelding_url</code> (afbeelding optioneel)
            </p>
            <textarea
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              rows={10}
              placeholder={"Wilson Padelracket Pro;89.99;https://partner.bol.com/click/...;https://media.s-bol.com/...\nAsics Hardloopschoen;94.99;https://partner.bol.com/click/..."}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-mono focus:outline-none focus:border-brand-gold transition-colors resize-none"
            />
            {geparsteRegels.length > 0 && (
              <div className="flex gap-3 mt-3">
                <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-mono">{aantalOk} geldig</span>
                {aantalFout > 0 && <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-mono">{aantalFout} fout</span>}
              </div>
            )}
          </div>

          <button
            onClick={handleOpslaan}
            disabled={opslaan || aantalOk === 0}
            className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40"
          >
            {opslaan ? "Opslaan..." : `${aantalOk} producten toevoegen`}
          </button>
        </>
      )}
    </div>
  );
}
