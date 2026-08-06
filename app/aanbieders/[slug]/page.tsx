import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sport?: string; categorie?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: provider } = await supabase.from("providers").select("naam").eq("slug", slug).single();
  if (!provider) return { title: "Aanbieder — StartSport" };
  return { title: `${provider.naam} — alle producten — StartSport` };
}

export default async function AanbiederProductenPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sport: sportFilter, categorie: categorieFilter } = await searchParams;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, naam, slug")
    .eq("slug", slug)
    .eq("actief", true)
    .single();

  if (!provider) notFound();

  let query = supabase
    .from("products")
    .select(`
      id, naam, merk, prijs, afbeelding_url, affiliate_url,
      sports ( naam, slug ),
      categories ( naam, slug )
    `)
    .eq("provider_id", provider.id)
    .eq("actief", true)
    .order("score", { ascending: false })
    .limit(120);

  if (sportFilter) {
    const { data: sport } = await supabase.from("sports").select("id").eq("slug", sportFilter).single();
    if (sport) query = query.eq("sport_id", sport.id);
  }
  if (categorieFilter) {
    const { data: categorie } = await supabase.from("categories").select("id").eq("slug", categorieFilter).single();
    if (categorie) query = query.eq("category_id", categorie.id);
  }

  const [{ data: producten }, { data: sporten }, { data: categorieen }] = await Promise.all([
    query,
    supabase.from("sports").select("naam, slug").eq("actief", true).order("volgorde"),
    supabase.from("categories").select("naam, slug").order("volgorde"),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs font-mono text-brand-muted mb-8">
            <Link href="/" className="hover:text-brand-ivory transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/aanbieders" className="hover:text-brand-ivory transition-colors">Aanbieders</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-gold">{provider.naam}</span>
          </nav>

          <h1 className="font-display text-4xl text-brand-ivory mb-2">{provider.naam}</h1>
          <p className="text-brand-muted font-body text-sm mb-8">
            {producten?.length ?? 0} producten — bekijk direct, zonder de configurator te gebruiken.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href={`/aanbieders/${slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                !sportFilter && !categorieFilter ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
              }`}
            >
              Alles
            </Link>
            {(sporten ?? []).map((s) => (
              <Link
                key={s.slug}
                href={`/aanbieders/${slug}?sport=${s.slug}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                  sportFilter === s.slug ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                }`}
              >
                {s.naam}
              </Link>
            ))}
          </div>

          {producten && producten.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {producten.map((product) => {
                const categorieNaam = Array.isArray(product.categories) ? product.categories[0]?.naam : (product.categories as { naam: string } | null)?.naam;
                return (
                  <a
                    key={product.id}
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-surface rounded-2xl overflow-hidden group hover:border-brand-gold/30 transition-colors"
                  >
                    <div className="relative h-40 bg-brand-surface flex items-center justify-center overflow-hidden">
                      {product.afbeelding_url ? (
                        <Image
                          src={product.afbeelding_url}
                          alt={product.naam}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl opacity-30">📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      {categorieNaam && (
                        <p className="text-brand-gold text-[10px] font-mono uppercase tracking-widest mb-1">{categorieNaam}</p>
                      )}
                      <p className="text-brand-ivory text-sm font-body leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">{product.naam}</p>
                      <p className="font-mono text-brand-gold text-base">€{Number(product.prijs).toFixed(2).replace(".", ",")}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-brand-muted font-body text-sm">Geen producten gevonden met deze filter.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
