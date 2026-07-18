import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: artikel } = await supabase
    .from("articles")
    .select("titel, samenvatting")
    .eq("slug", slug)
    .eq("gepubliceerd", true)
    .single();

  if (!artikel) return { title: "Koopgids — StartSport" };
  return {
    title: `${artikel.titel} — StartSport`,
    description: artikel.samenvatting,
  };
}

export default async function ArtikelPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: artikel } = await supabase
    .from("articles")
    .select("titel, samenvatting, inhoud, created_at, sport_id, sports ( naam, slug )")
    .eq("slug", slug)
    .eq("gepubliceerd", true)
    .single();

  if (!artikel) notFound();

  const sport = Array.isArray(artikel.sports) ? artikel.sports[0] : artikel.sports as { naam: string; slug: string } | null;

  // Platte tekst met witregels tussen paragrafen omzetten naar <p>-elementen
  const paragrafen = artikel.inhoud.split(/\n\s*\n/).filter((p: string) => p.trim());

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <article className="max-w-2xl mx-auto">
          <Link href="/advies" className="text-brand-muted text-xs font-mono hover:text-brand-ivory transition-colors">
            ← Alle koopgidsen
          </Link>

          {sport && (
            <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mt-6 mb-3">
              {sport.naam}
            </p>
          )}
          <h1 className="font-display text-4xl text-brand-ivory mb-4 leading-tight">{artikel.titel}</h1>
          <p className="text-brand-muted font-body text-base mb-10 leading-relaxed">{artikel.samenvatting}</p>

          <div className="space-y-5 text-brand-ivory/90 font-body text-[15px] leading-relaxed">
            {paragrafen.map((p, i) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </div>

          {sport && (
            <div className="mt-12 p-6 card-surface rounded-2xl text-center">
              <p className="text-brand-ivory font-body text-sm mb-4">
                Klaar om je eigen {sport.naam.toLowerCase()}-pakket samen te stellen?
              </p>
              <Link
                href={`/configurator?sport=${sport.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-shimmer text-brand-black text-sm font-medium"
              >
                Start de configurator
              </Link>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
