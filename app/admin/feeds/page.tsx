"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface FeedSubscription {
  id: string;
  naam: string;
  feed_url: string;
  actief: boolean;
  laatste_sync: string | null;
  laatste_resultaat: string | null;
  sports: { naam: string } | { naam: string }[] | null;
}

export default function FeedsPage() {
  const supabase = createClient();
  const [feeds, setFeeds] = useState<FeedSubscription[]>([]);
  const [laden, setLaden] = useState(true);
  const [syncBezig, setSyncBezig] = useState(false);
  const [syncResultaat, setSyncResultaat] = useState<string | null>(null);

  async function laad() {
    const { data } = await supabase
      .from("feed_subscriptions")
      .select("id, naam, feed_url, actief, laatste_sync, laatste_resultaat, sports ( naam )")
      .order("created_at", { ascending: false });
    setFeeds((data ?? []) as unknown as FeedSubscription[]);
    setLaden(false);
  }

  useEffect(() => { laad(); }, []);

  async function handleHandmatigSyncen() {
    setSyncBezig(true);
    setSyncResultaat(null);
    try {
      const res = await fetch("/api/admin/sync-feeds-nu", { method: "POST" });
      const data = await res.json();
      setSyncResultaat(res.ok ? "Synchronisatie voltooid — zie resultaten hieronder." : `Fout: ${data.error}`);
      await laad();
    } catch {
      setSyncResultaat("Er ging iets mis bij het starten van de synchronisatie.");
    } finally {
      setSyncBezig(false);
    }
  }

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-brand-ivory mb-1">Automatische feeds</h1>
          <p className="text-brand-muted text-sm font-body">
            Draait elke nacht om 03:00 automatisch — geen handmatig werk meer nodig.
          </p>
        </div>
        <Link href="/admin/feeds/nieuw" className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
          ＋ Feed toevoegen
        </Link>
      </div>

      {/* Handmatig nu synchroniseren */}
      <div className="card-surface rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-brand-ivory font-body text-sm mb-1">Niet wachten tot vannacht?</p>
          <p className="text-brand-muted text-xs font-mono">Start de synchronisatie nu handmatig.</p>
        </div>
        <button
          onClick={handleHandmatigSyncen}
          disabled={syncBezig}
          className="px-5 py-2.5 rounded-xl border border-brand-gold/40 text-brand-gold text-sm font-medium hover:bg-brand-gold/5 transition-colors disabled:opacity-40"
        >
          {syncBezig ? "Bezig..." : "Nu synchroniseren"}
        </button>
      </div>
      {syncResultaat && <p className="text-brand-muted text-xs font-mono mb-6">{syncResultaat}</p>}

      {/* Lijst */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Feed", "Sport", "Laatste sync", "Resultaat", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feeds.map((f) => {
              const sportNaam = Array.isArray(f.sports) ? f.sports[0]?.naam : f.sports?.naam;
              return (
                <tr key={f.id} className="border-b border-brand-border/50">
                  <td className="px-5 py-4 text-brand-ivory font-body">{f.naam}</td>
                  <td className="px-5 py-4 text-brand-muted font-mono text-xs">{sportNaam ?? "—"}</td>
                  <td className="px-5 py-4 text-brand-muted font-mono text-xs">
                    {f.laatste_sync ? new Date(f.laatste_sync).toLocaleString("nl-NL") : "Nog niet gesynchroniseerd"}
                  </td>
                  <td className="px-5 py-4 text-brand-muted font-mono text-xs max-w-xs truncate">{f.laatste_resultaat ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`w-2 h-2 rounded-full inline-block ${f.actief ? "bg-green-500" : "bg-red-500/50"}`} />
                  </td>
                </tr>
              );
            })}
            {feeds.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-brand-muted font-mono text-sm">
                Nog geen feeds gekoppeld. <Link href="/admin/feeds/nieuw" className="text-brand-gold underline">Voeg er een toe →</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
