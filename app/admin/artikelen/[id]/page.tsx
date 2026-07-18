"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function BewerkArtikelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const [titel, setTitel] = useState("");
  const [slug, setSlug] = useState("");
  const [samenvatting, setSamenvatting] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [sportId, setSportId] = useState("");
  const [gepubliceerd, setGepubliceerd] = useState(false);
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);

  useEffect(() => {
    async function laadData() {
      const [{ data: artikel }, { data: s }] = await Promise.all([
        supabase.from("articles").select("*").eq("id", id).single(),
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
      ]);
      if (artikel) {
        setTitel(artikel.titel);
        setSlug(artikel.slug);
        setSamenvatting(artikel.samenvatting);
        setInhoud(artikel.inhoud);
        setSportId(artikel.sport_id ?? "");
        setGepubliceerd(artikel.gepubliceerd);
      }
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setLaden(false);
    }
    laadData();
  }, [id]);

  async function handleOpslaan() {
    if (!titel || !slug || !samenvatting || !inhoud) {
      setFout("Titel, slug, samenvatting en inhoud zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("articles").update({
      titel, slug, samenvatting, inhoud,
      sport_id: sportId || null,
      gepubliceerd,
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/artikelen");
  }

  async function handleVerwijderen() {
    if (!confirm("Weet je zeker dat je dit artikel wilt verwijderen?")) return;
    setVerwijderen(true);
    await supabase.from("articles").delete().eq("id", id);
    router.push("/admin/artikelen");
  }

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Artikel bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Titel" naam="titel" verplicht waarde={titel} onChange={(v) => setTitel(v as string)} />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} />
        <FormVeld label="Gerelateerde sport" naam="sport" type="select" waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld label="Samenvatting" naam="samenvatting" type="textarea" verplicht waarde={samenvatting} onChange={(v) => setSamenvatting(v as string)} />
        <div>
          <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Inhoud <span className="text-brand-gold">*</span></label>
          <textarea
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            rows={16}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors resize-none leading-relaxed"
          />
        </div>
        <FormVeld label="Gepubliceerd" naam="gepubliceerd" type="checkbox" waarde={gepubliceerd} onChange={(v) => setGepubliceerd(v as boolean)} />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>

        <div className="border-t border-brand-border pt-6">
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">Gevaarzone</p>
          <button onClick={handleVerwijderen} disabled={verwijderen}
            className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/10 transition-colors disabled:opacity-40">
            {verwijderen ? "Verwijderen..." : "Artikel verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
