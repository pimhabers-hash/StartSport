"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function CategorieenPage() {
  const supabase = createClient();
  const router = useRouter();
  const [categorieen, setCategorieen] = useState<{ id: string; naam: string; slug: string; volgorde: number }[]>([]);
  const [naam, setNaam] = useState("");
  const [slug, setSlug] = useState("");
  const [volgorde, setVolgorde] = useState("0");
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function laad() {
    const { data } = await supabase.from("categories").select("id, naam, slug, volgorde").order("volgorde");
    setCategorieen(data ?? []);
  }

  useEffect(() => { laad(); }, []);

  function handleNaam(v: string) {
    setNaam(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  async function handleToevoegen() {
    if (!naam || !slug) { setFout("Naam en slug zijn verplicht."); return; }
    setOpslaan(true); setFout(null);
    const { error } = await supabase.from("categories").insert({ naam, slug, volgorde: parseInt(volgorde) });
    if (error) { setFout(error.message); setOpslaan(false); return; }
    setNaam(""); setSlug(""); setVolgorde("0");
    setOpslaan(false);
    laad();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-brand-ivory mb-8">Categorieën</h1>

      {/* Bestaande categorieën */}
      <div className="card-surface rounded-2xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Naam", "Slug", "Volgorde"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categorieen.map((cat) => (
              <tr key={cat.id} className="border-b border-brand-border/50">
                <td className="px-5 py-3 text-brand-ivory">{cat.naam}</td>
                <td className="px-5 py-3 text-brand-muted font-mono text-xs">{cat.slug}</td>
                <td className="px-5 py-3 text-brand-muted font-mono text-xs">{cat.volgorde}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nieuwe categorie */}
      <div className="card-surface rounded-2xl p-6 space-y-4">
        <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Nieuwe categorie</p>
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => handleNaam(v as string)} placeholder="bijv. Schoenen" />
        <FormVeld label="Slug" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} />
        <FormVeld label="Volgorde" naam="volgorde" type="number" waarde={volgorde} onChange={(v) => setVolgorde(v as string)} />
        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}
        <button onClick={handleToevoegen} disabled={opslaan} className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
          {opslaan ? "Toevoegen..." : "Categorie toevoegen"}
        </button>
      </div>
    </div>
  );
}
