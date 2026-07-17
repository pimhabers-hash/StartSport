"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function BewerkProviderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const [naam, setNaam] = useState("");
  const [slug, setSlug] = useState("");
  const [netwerk, setNetwerk] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [actief, setActief] = useState(true);
  const [aantalProducten, setAantalProducten] = useState(0);

  useEffect(() => {
    async function laadData() {
      const [{ data: provider }, { count }] = await Promise.all([
        supabase.from("providers").select("*").eq("id", id).single(),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("provider_id", id),
      ]);

      if (provider) {
        setNaam(provider.naam);
        setSlug(provider.slug);
        setNetwerk(provider.affiliate_netwerk ?? "");
        setLogoUrl(provider.logo_url ?? "");
        setActief(provider.actief);
      }
      setAantalProducten(count ?? 0);
      setLaden(false);
    }
    laadData();
  }, [id]);

  async function handleOpslaan() {
    if (!naam || !slug) { setFout("Naam en slug zijn verplicht."); return; }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("providers").update({
      naam, slug,
      affiliate_netwerk: netwerk || null,
      logo_url: logoUrl || null,
      actief,
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/providers");
  }

  async function handleVerwijderen() {
    if (aantalProducten > 0) {
      alert(`Deze aanbieder kan niet verwijderd worden — er zijn nog ${aantalProducten} producten aan gekoppeld. Verwijder of wijzig eerst die producten.`);
      return;
    }
    if (!confirm("Weet je zeker dat je deze aanbieder wilt verwijderen?")) return;
    setVerwijderen(true);
    await supabase.from("providers").delete().eq("id", id);
    router.push("/admin/providers");
  }

  if (laden) {
    return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Aanbieder bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} />
        <FormVeld label="Slug" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} hulptekst="Let op: wijzigen kan bestaande links breken als deze elders wordt gebruikt" />
        <FormVeld
          label="Affiliate netwerk / programma"
          naam="netwerk"
          waarde={netwerk}
          onChange={(v) => setNetwerk(v as string)}
          placeholder="bijv. Bol Partner Programma"
        />
        <FormVeld label="Logo URL" naam="logo" type="url" waarde={logoUrl} onChange={(v) => setLogoUrl(v as string)} />
        <FormVeld label="Actief" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>

        <div className="border-t border-brand-border pt-6">
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Gevaarzone</p>
          <p className="text-brand-muted text-xs font-body mb-3">
            {aantalProducten} product{aantalProducten !== 1 ? "en" : ""} gekoppeld aan deze aanbieder.
          </p>
          <button onClick={handleVerwijderen} disabled={verwijderen}
            className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/10 transition-colors disabled:opacity-40">
            {verwijderen ? "Verwijderen..." : "Aanbieder verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
