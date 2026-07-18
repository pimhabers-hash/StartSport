"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function NieuwArtikelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [titel, setTitel] = useState("");
  const [slug, setSlug] = useState("");
  const [samenvatting, setSamenvatting] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [sportId, setSportId] = useState("");
  const [gepubliceerd, setGepubliceerd] = useState(false);
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    async function laad() {
      const { data } = await supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde");
      setSporten((data ?? []).map((s) => ({ label: s.naam, waarde: s.id })));
    }
    laad();
  }, []);

  function handleTitel(v: string) {
    setTitel(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
  }

  async function handleOpslaan() {
    if (!titel || !slug || !samenvatting || !inhoud) {
      setFout("Titel, slug, samenvatting en inhoud zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("articles").insert({
      titel, slug, samenvatting, inhoud,
      sport_id: sportId || null,
      gepubliceerd,
    });

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/artikelen");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Artikel schrijven</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Titel" naam="titel" verplicht waarde={titel} onChange={(v) => handleTitel(v as string)} placeholder="Beste padelracket voor beginners" />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} hulptekst="Wordt: startsport.nl/advies/deze-slug" />
        <FormVeld label="Gerelateerde sport (optioneel)" naam="sport" type="select" waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld
          label="Samenvatting"
          naam="samenvatting"
          type="textarea"
          verplicht
          waarde={samenvatting}
          onChange={(v) => setSamenvatting(v as string)}
          placeholder="Korte intro van 1-2 zinnen — verschijnt in het overzicht en als meta-omschrijving"
        />
        <div>
          <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">
            Inhoud <span className="text-brand-gold">*</span>
          </label>
          <textarea
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            rows={16}
            placeholder={"Schrijf hier je artikel.\n\nGebruik een lege regel tussen alinea's — die worden automatisch omgezet naar aparte paragrafen op de pagina.\n\nDerde alinea, enzovoort."}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors resize-none leading-relaxed"
          />
          <p className="text-brand-muted text-xs font-mono mt-1">Platte tekst — lege regel = nieuwe alinea. Geen opmaak-codes nodig.</p>
        </div>
        <FormVeld
          label="Direct publiceren"
          naam="gepubliceerd"
          type="checkbox"
          waarde={gepubliceerd}
          onChange={(v) => setGepubliceerd(v as boolean)}
        />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : gepubliceerd ? "Publiceren" : "Opslaan als concept"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>
      </div>
    </div>
  );
}
