"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

const VOORBEELD_ICONEN = ["🏅", "🎾", "👟", "🏋️", "🏐", "⛳", "🏓", "🤺", "⚽", "🏀", "🚴", "🏊", "🥊", "🧗", "⛷️", "🏂"];

export default function BewerkSportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [aantalProducten, setAantalProducten] = useState(0);

  const [naam, setNaam] = useState("");
  const [slug, setSlug] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [binnenBuiten, setBinnenBuiten] = useState("beide");
  const [icoon, setIcoon] = useState("🏅");
  const [volgorde, setVolgorde] = useState("0");
  const [actief, setActief] = useState(true);

  useEffect(() => {
    async function laadData() {
      const [{ data: sport }, { count }] = await Promise.all([
        supabase.from("sports").select("*").eq("id", id).single(),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("sport_id", id),
      ]);
      if (sport) {
        setNaam(sport.naam);
        setSlug(sport.slug);
        setBeschrijving(sport.beschrijving ?? "");
        setBinnenBuiten(sport.binnen_buiten ?? "beide");
        setIcoon(sport.icoon ?? "🏅");
        setVolgorde(String(sport.volgorde ?? 0));
        setActief(sport.actief);
      }
      setAantalProducten(count ?? 0);
      setLaden(false);
    }
    laadData();
  }, [id]);

  async function handleOpslaan() {
    if (!naam || !slug) { setFout("Naam en slug zijn verplicht."); return; }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("sports").update({
      naam, slug,
      beschrijving: beschrijving || null,
      binnen_buiten: binnenBuiten as "binnen" | "buiten" | "beide",
      icoon,
      volgorde: parseInt(volgorde),
      actief,
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/sporten");
  }

  async function handleVerwijderen() {
    if (aantalProducten > 0) {
      alert(`Deze sport heeft nog ${aantalProducten} gekoppelde producten. Verwijder of verplaats die eerst.`);
      return;
    }
    if (!confirm("Weet je zeker dat je deze sport wilt verwijderen?")) return;
    setVerwijderen(true);
    await supabase.from("sports").delete().eq("id", id);
    router.push("/admin/sporten");
  }

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Sport bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} hulptekst="Wijzigen kan bestaande links breken" />

        <div>
          <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Icoon</label>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-2xl">
              {icoon}
            </div>
            <input
              type="text"
              value={icoon}
              onChange={(e) => setIcoon(e.target.value)}
              maxLength={4}
              className="w-24 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-brand-ivory text-lg text-center focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {VOORBEELD_ICONEN.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcoon(e)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${
                  icoon === e ? "border-brand-gold bg-brand-gold/10" : "border-brand-border hover:border-brand-gold/40"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <FormVeld label="Beschrijving" naam="beschrijving" type="textarea" waarde={beschrijving} onChange={(v) => setBeschrijving(v as string)} />
        <FormVeld label="Binnen/Buiten" naam="binnenBuiten" type="select" waarde={binnenBuiten} onChange={(v) => setBinnenBuiten(v as string)}
          opties={[{ label: "Beide", waarde: "beide" }, { label: "Binnen", waarde: "binnen" }, { label: "Buiten", waarde: "buiten" }]} />
        <FormVeld label="Volgorde" naam="volgorde" type="number" waarde={volgorde} onChange={(v) => setVolgorde(v as string)} />
        <FormVeld label="Actief" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>

        <div className="border-t border-brand-border pt-6">
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Gevaarzone</p>
          <p className="text-brand-muted text-xs font-body mb-3">{aantalProducten} product{aantalProducten !== 1 ? "en" : ""} gekoppeld.</p>
          <button onClick={handleVerwijderen} disabled={verwijderen}
            className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/10 transition-colors disabled:opacity-40">
            {verwijderen ? "Verwijderen..." : "Sport verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
