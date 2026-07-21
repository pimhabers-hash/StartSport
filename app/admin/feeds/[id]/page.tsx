"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function BewerkFeedPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const [naam, setNaam] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [sportId, setSportId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [grensBudget, setGrensBudget] = useState("50");
  const [grensMidden, setGrensMidden] = useState("150");
  const [actief, setActief] = useState(true);
  const [laatsteResultaat, setLaatsteResultaat] = useState<string | null>(null);
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);
  const [providers, setProviders] = useState<{ label: string; waarde: string }[]>([]);

  useEffect(() => {
    async function laadData() {
      const [{ data: feed }, { data: s }, { data: p }] = await Promise.all([
        supabase.from("feed_subscriptions").select("*").eq("id", id).single(),
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
      ]);
      if (feed) {
        setNaam(feed.naam);
        setFeedUrl(feed.feed_url);
        setSportId(feed.sport_id);
        setProviderId(feed.provider_id ?? "");
        setGrensBudget(String(feed.grens_budget));
        setGrensMidden(String(feed.grens_midden));
        setActief(feed.actief);
        setLaatsteResultaat(feed.laatste_resultaat);
      }
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setProviders((p ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setLaden(false);
    }
    laadData();
  }, [id]);

  async function handleOpslaan() {
    if (!naam || !feedUrl || !sportId) {
      setFout("Naam, feed-URL en sport zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("feed_subscriptions").update({
      naam, feed_url: feedUrl,
      sport_id: sportId,
      provider_id: providerId || null,
      grens_budget: parseFloat(grensBudget),
      grens_midden: parseFloat(grensMidden),
      actief,
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/feeds");
  }

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Feed bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Naam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} />
        <FormVeld label="Feed URL" naam="feedUrl" type="url" verplicht waarde={feedUrl} onChange={(v) => setFeedUrl(v as string)} />
        <FormVeld label="Sport" naam="sport" type="select" verplicht waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld label="Aanbieder" naam="provider" type="select" waarde={providerId} onChange={(v) => setProviderId(v as string)} opties={providers} />
        <div className="grid grid-cols-2 gap-4">
          <FormVeld label="Onder = Budget" naam="grensBudget" type="number" waarde={grensBudget} onChange={(v) => setGrensBudget(v as string)} />
          <FormVeld label="Onder = Middenklasse" naam="grensMidden" type="number" waarde={grensMidden} onChange={(v) => setGrensMidden(v as string)} />
        </div>
        <FormVeld label="Actief (meegenomen in nachtelijke sync)" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />

        {laatsteResultaat && (
          <div className="p-3 rounded-lg bg-brand-surface">
            <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-1">Laatste sync-resultaat</p>
            <p className="text-brand-ivory text-xs font-mono">{laatsteResultaat}</p>
          </div>
        )}

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>
      </div>
    </div>
  );
}
