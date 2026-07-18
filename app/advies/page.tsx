import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = { title: "Koopgidsen — StartSport" };

export default async function AdviesOverzichtPage() {
  const supabase = await createClient();
  const { data: artikelen } = await supabase
    .from("articles")
    .select("id, titel, slug, samenvatting, created_at, sports ( naam )")
    .eq("gepubliceerd", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Koopgidsen</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-4">
            Advies om de <em className="not-italic text-gold-gradient font-light">juiste keuze</em> te maken
          </h1>
          <p className="text-brand-muted font-body text-sm mb-12 max-w-xl">
            Diepgaande vergelijkingen en tips, geschreven om je te helpen — los van onze configurator.
          </p>

          {(!artikelen || artikelen.length === 0) ? (
            <p className="text-brand-muted font-body text-sm">Binnenkort verschijnen hier onze eerste koopgidsen.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {artikelen.map((artikel) => (
                <Link
                  key={artikel.id}
                  href={`/advies/${artikel.slug}`}
                  className="card-surface rounded-2xl p-6 hover:border-brand-gold/30 transition-colors group"
                >
                  {artikel.sports && (
                    <span className="text-brand-gold text-xs font-mono uppercase tracking-widest">
                      {Array.isArray(artikel.sports) ? artikel.sports[0]?.naam : (artikel.sports as { naam: string })?.naam}
                    </span>
                  )}
                  <h2 className="font-display text-lg text-brand-ivory mt-2 mb-2 group-hover:text-gold-gradient transition-colors">
                    {artikel.titel}
                  </h2>
                  <p className="text-brand-muted text-sm font-body leading-relaxed line-clamp-3">
                    {artikel.samenvatting}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
