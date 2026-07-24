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
  const { data: sport } = await supabase.from("sports").select("naam, beschrijving").eq("slug", slug).single();
  if (!sport) return { title: "Sport — StartSport" };
  return {
    title: `${sport.naam} uitrusting: koopgidsen, advies & configurator — StartSport`,
    description: sport.beschrijving ?? `Alles wat je moet weten over ${sport.naam}-uitrusting: koopgidsen, productadvies en een persoonlijke configurator.`,
  };
}

export default async function SportHubPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: sport } = await supabase
    .from("sports")
    .select("id, naam, slug, beschrijving, icoon")
    .eq("slug", slug)
    .eq("actief", true)
    .single();

  if (!sport) notFound();

  const [{ data: artikelen }, { data: producten }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, titel, slug, samenvatting")
      .eq("sport_id", sport.id)
      .eq("gepubliceerd", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, naam, merk, prijs, afbeelding_url, categories ( naam )")
      .eq("sport_id", sport.id)
      .eq("actief", true)
      .order("score", { ascending: false })
      .limit(6),
  ]);

  // Breadcrumb structured data — helpt Google de sitehiërarchie te begrijpen
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://startsport.nl" },
      { "@type": "ListItem", position: 2, name: sport.naam, item: `https://startsport.nl/sporten/${sport.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb zichtbaar */}
          <nav className="text-xs font-mono text-brand-muted mb-8">
            <Link href="/" className="hover:text-brand-ivory transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-gold">{sport.naam}</span>
          </nav>

          {/* Hero */}
          <div className="mb-14 max-w-2xl">
            <span className="text-4xl mb-4 inline-block">{sport.icoon ?? "🏅"}</span>
            <h1 className="font-display text-4xl lg:text-5xl text-brand-ivory mb-4 leading-tight">
              {sport.naam}{" "}
              <em className="not-italic text-gold-gradient font-light">uitrusting</em>
            </h1>
            {sport.beschrijving && (
              <p className="text-brand-muted font-body text-base leading-relaxed">{sport.beschrijving}</p>
            )}
            <Link
              href={`/configurator?sport=${sport.slug}`}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl gold-shimmer text-brand-black text-sm font-medium"
            >
              Vind jouw {sport.naam.toLowerCase()}pakket
            </Link>
          </div>

          {/* Koopgidsen voor deze sport */}
          {artikelen && artikelen.length > 0 && (
            <section className="mb-16">
              <h2 className="font-display text-2xl text-brand-ivory mb-6">
                {sport.naam}-koopgidsen
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {artikelen.map((artikel) => (
                  <Link
                    key={artikel.id}
                    href={`/advies/${artikel.slug}`}
                    className="card-surface rounded-2xl p-6 hover:border-brand-gold/30 transition-colors group"
                  >
                    <h3 className="font-display text-lg text-brand-ivory mb-2 group-hover:text-gold-gradient transition-colors">
                      {artikel.titel}
                    </h3>
                    <p className="text-brand-muted text-sm font-body leading-relaxed line-clamp-3">
                      {artikel.samenvatting}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Populaire producten */}
          {producten && producten.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-brand-ivory mb-6">
                Populaire {sport.naam.toLowerCase()}-producten
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {producten.map((product) => {
                  const categorieNaam = Array.isArray(product.categories)
                    ? product.categories[0]?.naam
                    : (product.categories as { naam: string } | null)?.naam;
                  return (
                    <Link
                      key={product.id}
                      href={`/configurator?sport=${sport.slug}`}
                      className="card-surface rounded-2xl p-5 hover:border-brand-gold/30 transition-colors"
                    >
                      {categorieNaam && (
                        <span className="text-brand-gold text-xs font-mono uppercase tracking-widest">{categorieNaam}</span>
                      )}
                      <p className="text-brand-ivory font-body mt-2 mb-1">{product.naam}</p>
                      <p className="font-mono text-brand-gold">€{Number(product.prijs).toFixed(2).replace(".", ",")}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {(!artikelen || artikelen.length === 0) && (!producten || producten.length === 0) && (
            <p className="text-brand-muted font-body text-sm">
              Binnenkort verschijnt hier meer content voor {sport.naam}.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
