import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = {
  title: "Onze aanbieders — StartSport",
  description: "Bekijk alle sportwinkels en merken waarmee StartSport samenwerkt, en welke sporten zij aanbieden.",
};

interface ProviderInfo {
  id: string;
  naam: string;
  slug: string;
  logo_url: string | null;
  aantalProducten: number;
  sporten: { naam: string; slug: string }[];
  heeftUniverseleProducten: boolean;
}

export default async function AanbiedersPage() {
  const supabase = await createClient();

  const [{ data: providers }, { data: producten }] = await Promise.all([
    supabase.from("providers").select("id, naam, slug, logo_url").eq("actief", true).order("naam"),
    supabase
      .from("products")
      .select("provider_id, sport_id, sports ( naam, slug )")
      .eq("actief", true)
      .not("provider_id", "is", null),
  ]);

  // Aggregeren: per aanbieder welke sporten ze bedienen en hoeveel producten
  const infoPerProvider = new Map<string, ProviderInfo>();

  (providers ?? []).forEach((p) => {
    infoPerProvider.set(p.id, {
      id: p.id,
      naam: p.naam,
      slug: p.slug,
      logo_url: p.logo_url,
      aantalProducten: 0,
      sporten: [],
      heeftUniverseleProducten: false,
    });
  });

  (producten ?? []).forEach((prod) => {
    if (!prod.provider_id) return;
    const info = infoPerProvider.get(prod.provider_id);
    if (!info) return;

    info.aantalProducten += 1;

    if (!prod.sport_id) {
      info.heeftUniverseleProducten = true;
      return;
    }

    const sport = Array.isArray(prod.sports) ? prod.sports[0] : prod.sports as { naam: string; slug: string } | null;
    if (sport && !info.sporten.some((s) => s.slug === sport.slug)) {
      info.sporten.push(sport);
    }
  });

  // Alleen aanbieders met minstens één actief product tonen
  const zichtbareProviders = Array.from(infoPerProvider.values())
    .filter((p) => p.aantalProducten > 0)
    .sort((a, b) => b.aantalProducten - a.aantalProducten);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs font-mono text-brand-muted mb-8">
            <Link href="/" className="hover:text-brand-ivory transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-gold">Aanbieders</span>
          </nav>

          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Onze partners</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-4">
            Waar we mee{" "}
            <em className="not-italic text-gold-gradient font-light">samenwerken</em>
          </h1>
          <p className="text-brand-muted font-body text-sm mb-12 max-w-xl leading-relaxed">
            StartSport werkt samen met een groeiend aantal sportwinkels en merken. Hieronder zie je
            welke aanbieders we hebben, en voor welke sporten zij producten leveren — helemaal los
            van de configurator, gewoon om te verkennen.
          </p>

          {zichtbareProviders.length === 0 ? (
            <p className="text-brand-muted font-body text-sm">Binnenkort verschijnen hier onze partners.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {zichtbareProviders.map((provider) => (
                <div key={provider.id} className="card-surface rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="font-display text-lg text-brand-ivory">{provider.naam}</h2>
                    <span className="px-2.5 py-1 rounded-full bg-brand-surface text-brand-muted text-xs font-mono flex-shrink-0">
                      {provider.aantalProducten} product{provider.aantalProducten !== 1 ? "en" : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {provider.sporten.map((sport) => (
                      <Link
                        key={sport.slug}
                        href={`/sporten/${sport.slug}`}
                        className="px-3 py-1 rounded-full border border-brand-gold/30 text-brand-gold text-xs font-mono hover:bg-brand-gold/10 transition-colors"
                      >
                        {sport.naam}
                      </Link>
                    ))}
                    {provider.heeftUniverseleProducten && (
                      <span className="px-3 py-1 rounded-full border border-brand-border text-brand-muted text-xs font-mono">
                        Alle sporten
                      </span>
                    )}
                    {provider.sporten.length === 0 && !provider.heeftUniverseleProducten && (
                      <span className="text-brand-muted text-xs font-mono">Nog geen sport gekoppeld</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
