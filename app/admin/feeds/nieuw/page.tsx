"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function NieuweFeedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [naam, setNaam] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [sportId, setSportId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [grensBudget, setGrensBudget] = useState("50");
  const [grensMidden, setGrensMidden] = useState("150");
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);
  const [providers, setProviders] = useState<{ label: string; waarde: string }[]>([]);
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    async function laad() {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
      ]);
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setProviders((p ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
    }
    laad();
  }, []);

  async function handleOpslaan() {
    if (!naam || !feedUrl || !sportId) {
      setFout("Naam, feed-URL en sport zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("feed_subscriptions").insert({
      naam, feed_url: feedUrl,
      sport_id: sportId,
      provider_id: providerId || null,
      grens_budget: parseFloat(grensBudget),
      grens_midden: parseFloat(grensMidden),
      actief: true,
    });

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/feeds");
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Feed toevoegen</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} placeholder="bijv. Padel Market (Awin)" />
        <FormVeld
          label="Feed URL"
          naam="feedUrl"
          type="url"
          verplicht
          waarde={feedUrl}
          onChange={(v) => setFeedUrl(v as string)}
          placeholder="https://productdata.awin.com/datafeed/download/..."
          hulptekst="De directe download-URL uit je Awin/Daisycon datafeed-overzicht (kolom 'URL')"
        />
        <FormVeld label="Sport" naam="sport" type="select" verplicht waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld label="Aanbieder" naam="provider" type="select" waarde={providerId} onChange={(v) => setProviderId(v as string)} opties={providers} />
        <div className="grid grid-cols-2 gap-4">
          <FormVeld label="Onder = Budget" naam="grensBudget" type="number" waarde={grensBudget} onChange={(v) => setGrensBudget(v as string)} />
          <FormVeld label="Onder = Middenklasse" naam="grensMidden" type="number" waarde={grensMidden} onChange={(v) => setGrensMidden(v as string)} />
        </div>

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Feed toevoegen"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>

        <p className="text-brand-muted text-xs font-mono border-t border-brand-border pt-4">
          Let op: categorieën worden automatisch gekoppeld op basis van sleutelwoorden in de feed.
          Producten met een categorie die niet herkend wordt, worden overgeslagen — check dit na de
          eerste synchronisatie bij Producten.
        </p>
      </div>
    </div>
  );
}
