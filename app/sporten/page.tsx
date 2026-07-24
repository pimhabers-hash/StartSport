import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = {
  title: "Alle sporten — StartSport",
  description: "Ontdek koopgidsen, productadvies en de configurator voor elke sport die StartSport ondersteunt.",
};

export default async function SportenOverzichtPage() {
  const supabase = await createClient();
  const { data: sporten } = await supabase
    .from("sports")
    .select("id, naam, slug, beschrijving, icoon")
    .eq("actief", true)
    .order("volgorde");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs font-mono text-brand-muted mb-8">
            <Link href="/" className="hover:text-brand-ivory transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-gold">Sporten</span>
          </nav>

          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Alle sporten</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-4">
            Kies je <em className="not-italic text-gold-gradient font-light">sport</em>
          </h1>
          <p className="text-brand-muted font-body text-sm mb-12 max-w-xl">
            Voor elke sport hebben we koopgidsen, productadvies en een configurator die je helpt de juiste uitrusting te vinden.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(sporten ?? []).map((sport) => (
              <Link
                key={sport.id}
                href={`/sporten/${sport.slug}`}
                className="card-surface rounded-2xl p-6 hover:border-brand-gold/30 transition-colors group"
              >
                <span className="text-3xl mb-3 inline-block">{sport.icoon ?? "🏅"}</span>
                <h2 className="font-display text-xl text-brand-ivory mb-2 group-hover:text-gold-gradient transition-colors">
                  {sport.naam}
                </h2>
                {sport.beschrijving && (
                  <p className="text-brand-muted text-sm font-body leading-relaxed line-clamp-2">{sport.beschrijving}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
