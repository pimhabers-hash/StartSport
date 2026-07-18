import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sporten — Admin StartSport" };

export default async function SportenPage() {
  const supabase = await createClient();
  const { data: sporten } = await supabase
    .from("sports")
    .select("id, naam, slug, actief, volgorde, icoon")
    .order("volgorde");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-brand-ivory mb-1">Sporten</h1>
          <p className="text-brand-muted text-sm font-body">{sporten?.length ?? 0} sporten</p>
        </div>
        <Link href="/admin/sporten/nieuw" className="px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
          ＋ Sport toevoegen
        </Link>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Naam", "Slug", "Volgorde", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sporten ?? []).map((sport) => (
              <tr key={sport.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                <td className="px-5 py-4 text-brand-ivory font-body">
                  <span className="mr-2">{sport.icoon ?? "🏅"}</span>{sport.naam}
                </td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">{sport.slug}</td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">{sport.volgorde}</td>
                <td className="px-5 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block ${sport.actief ? "bg-green-500" : "bg-red-500/50"}`} />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/admin/sporten/${sport.id}`} className="text-brand-muted text-xs font-mono hover:text-brand-gold transition-colors">
                    Bewerk →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
