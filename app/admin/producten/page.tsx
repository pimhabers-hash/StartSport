import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Producten — Admin StartSport" };

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function ProductenPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      id, naam, merk, prijs, budgetklasse, actief, geclassificeerd, bron,
      sports ( naam ),
      categories ( naam )
    `)
    .order("created_at", { ascending: false });

  if (filter === "niet_geclassificeerd") {
    query = query.eq("geclassificeerd", false);
  }

  const { data: producten } = await query;

  const { count: aantalNietGeclassificeerd } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("geclassificeerd", false);

  const BUDGET_LABEL: Record<string, string> = {
    budget: "Budget", middenklasse: "Midden", premium: "Premium",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-brand-ivory mb-1">Producten</h1>
          <p className="text-brand-muted text-sm font-body">
            {producten?.length ?? 0} producten {filter === "niet_geclassificeerd" && "(niet geclassificeerd)"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/producten/import"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-gold/40 text-brand-gold text-sm font-medium hover:bg-brand-gold/5 transition-colors"
          >
            📄 CSV Import
          </Link>
          <Link
            href="/admin/producten/nieuw"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium"
          >
            ＋ Product toevoegen
          </Link>
        </div>
      </div>

      {/* Waarschuwing voor niet-geclassificeerde producten */}
      {aantalNietGeclassificeerd !== null && aantalNietGeclassificeerd > 0 && filter !== "niet_geclassificeerd" && (
        <Link
          href="/admin/producten?filter=niet_geclassificeerd"
          className="flex items-center justify-between mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors"
        >
          <span className="text-amber-400 text-sm font-body">
            ⚠️ {aantalNietGeclassificeerd} producten uit CSV-import wachten nog op classificatie (niveau instellen) en staan daardoor niet zichtbaar in de configurator.
          </span>
          <span className="text-amber-400 text-xs font-mono">Bekijk →</span>
        </Link>
      )}

      {filter === "niet_geclassificeerd" && (
        <Link href="/admin/producten" className="inline-block mb-4 text-brand-muted text-xs font-mono hover:text-brand-ivory">
          ← Alle producten tonen
        </Link>
      )}

      {/* Tabel */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Product", "Sport", "Categorie", "Budget", "Prijs", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-brand-muted text-xs font-mono uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(producten ?? []).map((product) => (
              <tr key={product.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <p className="text-brand-ivory font-body">{product.naam}</p>
                    {!product.geclassificeerd && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                        TE CLASSIFICEREN
                      </span>
                    )}
                  </div>
                  {product.merk && <p className="text-brand-muted text-xs font-mono">{product.merk}</p>}
                </td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">
                  {Array.isArray(product.sports) ? product.sports[0]?.naam : (product.sports as {naam: string} | null)?.naam ?? "—"}
                </td>
                <td className="px-5 py-4 text-brand-muted font-mono text-xs">
                  {Array.isArray(product.categories) ? product.categories[0]?.naam : (product.categories as {naam: string} | null)?.naam ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono border border-brand-border text-brand-muted">
                    {BUDGET_LABEL[product.budgetklasse]}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-brand-gold">
                  €{Number(product.prijs).toFixed(2).replace(".", ",")}
                </td>
                <td className="px-5 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block ${product.actief ? "bg-green-500" : "bg-red-500/50"}`} />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/admin/producten/${product.id}`} className="text-brand-muted text-xs font-mono hover:text-brand-gold transition-colors">
                    Bewerk →
                  </Link>
                </td>
              </tr>
            ))}
            {(!producten || producten.length === 0) && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-brand-muted font-mono text-sm">
                  Geen producten gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
