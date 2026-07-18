import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Artikelen — Admin StartSport" };

export default async function ArtikelenPage() {
  const supabase = await createClient();
  const { data: artikelen } = await supabase
    .from("articles")
    .select("id, titel, slug, gepubliceerd, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-brand-ivory mb-1">Artikelen</h1>
          <p className="text-brand-muted text-sm font-body">{artikelen?.length ?? 0} koopgidsen</p>
        </div>
        <Link href="/admin/artikelen/nieuw" className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
          ＋ Artikel schrijven
        </Link>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Titel", "Slug", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(artikelen ?? []).map((a) => (
              <tr key={a.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                <td className="px-5 py-4 text-brand-ivory font-body">{a.titel}</td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">/advies/{a.slug}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                    a.gepubliceerd ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {a.gepubliceerd ? "gepubliceerd" : "concept"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link href={`/admin/artikelen/${a.id}`} className="text-brand-muted text-xs font-mono hover:text-brand-gold transition-colors">
                    Bewerk →
                  </Link>
                </td>
              </tr>
            ))}
            {(!artikelen || artikelen.length === 0) && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-brand-muted font-mono text-sm">Nog geen artikelen.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
