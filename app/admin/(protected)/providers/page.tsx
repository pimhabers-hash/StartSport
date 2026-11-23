"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function ProvidersPage() {
  const supabase = createClient();
  const [providers, setProviders] = useState<{ id: string; naam: string; slug: string; affiliate_netwerk: string | null; actief: boolean }[]>([]);
  const [naam, setNaam] = useState("");
  const [slug, setSlug] = useState("");
  const [netwerk, setNetwerk] = useState("");
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function laad() {
    const { data } = await supabase.from("providers").select("id, naam, slug, affiliate_netwerk, actief").order("naam");
    setProviders(data ?? []);
  }

  useEffect(() => { laad(); }, []);

  function handleNaam(v: string) {
    setNaam(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  async function handleToevoegen() {
    if (!naam || !slug) { setFout("Naam en slug zijn verplicht."); return; }
    setOpslaan(true); setFout(null);
    const { error } = await supabase.from("providers").insert({
      naam, slug, affiliate_netwerk: netwerk || null, actief: true,
    });
    if (error) { setFout(error.message); setOpslaan(false); return; }
    setNaam(""); setSlug(""); setNetwerk("");
    setOpslaan(false);
    laad();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-brand-ivory mb-8">Aanbieders</h1>

      <div className="card-surface rounded-2xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Naam", "Slug", "Netwerk", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                <td className="px-5 py-3 text-brand-ivory">{p.naam}</td>
                <td className="px-5 py-3 text-brand-muted font-mono text-xs">{p.slug}</td>
                <td className="px-5 py-3 text-brand-muted font-mono text-xs">{p.affiliate_netwerk ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block ${p.actief ? "bg-green-500" : "bg-red-500/50"}`} />
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/providers/${p.id}`} className="text-brand-muted text-xs font-mono hover:text-brand-gold transition-colors">
                    Bewerk →
                  </Link>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-brand-muted font-mono text-sm">Nog geen aanbieders.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-surface rounded-2xl p-6 space-y-4">
        <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Nieuwe aanbieder</p>
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => handleNaam(v as string)} placeholder="bijv. Bol" />
        <FormVeld label="Slug" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} />
        <FormVeld
          label="Affiliate netwerk / programma"
          naam="netwerk"
          waarde={netwerk}
          onChange={(v) => setNetwerk(v as string)}
          placeholder="bijv. Bol Partner Programma, Awin, Daisycon"
          hulptekst="Puur informatief — het platform waarmee je commissie afspreekt"
        />
        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}
        <button onClick={handleToevoegen} disabled={opslaan} className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
          {opslaan ? "Toevoegen..." : "Aanbieder toevoegen"}
        </button>
      </div>
    </div>
  );
}
