"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function NieuweSportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [naam,          setNaam]          = useState("");
  const [slug,          setSlug]          = useState("");
  const [beschrijving,  setBeschrijving]  = useState("");
  const [binnenBuiten,  setBinnenBuiten]  = useState("beide");
  const [volgorde,      setVolgorde]      = useState("0");
  const [actief,        setActief]        = useState(true);
  const [opslaan,       setOpslaan]       = useState(false);
  const [fout,          setFout]          = useState<string | null>(null);

  // Automatisch slug genereren vanuit naam
  function handleNaamChange(waarde: string) {
    setNaam(waarde);
    setSlug(waarde.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  async function handleOpslaan() {
    if (!naam || !slug) { setFout("Naam en slug zijn verplicht."); return; }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("sports").insert({
      naam, slug, beschrijving: beschrijving || null,
      binnen_buiten: binnenBuiten as "binnen" | "buiten" | "beide",
      volgorde: parseInt(volgorde), actief,
    });

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/sporten");
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Sport toevoegen</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => handleNaamChange(v as string)} placeholder="bijv. Padel" />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} placeholder="padel" hulptekst="Wordt automatisch gegenereerd vanuit de naam" />
        <FormVeld label="Beschrijving" naam="beschrijving" type="textarea" waarde={beschrijving} onChange={(v) => setBeschrijving(v as string)} />
        <FormVeld label="Binnen/Buiten" naam="binnenBuiten" type="select" waarde={binnenBuiten} onChange={(v) => setBinnenBuiten(v as string)}
          opties={[{ label: "Beide", waarde: "beide" }, { label: "Binnen", waarde: "binnen" }, { label: "Buiten", waarde: "buiten" }]} />
        <FormVeld label="Volgorde (lager = eerder)" naam="volgorde" type="number" waarde={volgorde} onChange={(v) => setVolgorde(v as string)} />
        <FormVeld label="Actief" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Sport opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>
      </div>
    </div>
  );
}
