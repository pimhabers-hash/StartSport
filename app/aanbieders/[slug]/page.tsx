import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { ProductAfbeelding } from "@/components/ProductAfbeelding";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sport?: string; categorie?: string; pagina?: string }>;
}

const PAGINA_GROOTTE = 40;
const FACET_PAGINA_GROOTTE = 1000;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: provider } = await supabase.from("providers").select("naam").eq("slug", slug).single();
  if (!provider) return { title: "Aanbieder — StartSport" };
  return { title: `${provider.naam} — alle producten — StartSport` };
}

type FacetRij = {
  sport_id: string | null;
  category_id: string | null;
  sports: { naam: string; slug: string } | { naam: string; slug: string }[] | null;
  categories: { naam: string; slug: string } | { naam: string; slug: string }[] | null;
};

/**
 * Welke sporten/categorieën heeft déze aanbieder daadwerkelijk in de
 * catalogus? Gepagineerd in stappen van 1000 (zelfde reden als op de
 * aanbieders-overzichtspagina: één select() haalt er standaard maar 1000
 * op). Nodig om de filterknoppen te beperken tot wat relevant is — een
 * aanbieder die alleen padel voert, hoeft geen "Hardlopen"-knop te tonen
 * die toch altijd naar "geen producten" leidt.
 */
async function haalProviderFacetten(supabase: Awaited<ReturnType<typeof createClient>>, providerId: string) {
  const sportTellingen = new Map<string, { naam: string; aantal: number }>();
  const categorieTellingen = new Map<string, { naam: string; aantal: number }>();

  for (let vanaf = 0; ; vanaf += FACET_PAGINA_GROOTTE) {
    const { data, error } = await supabase
      .from("products")
      .select("sport_id, category_id, sports ( naam, slug ), categories ( naam, slug )")
      .eq("provider_id", providerId)
      .eq("actief", true)
      .order("id")
      .range(vanaf, vanaf + FACET_PAGINA_GROOTTE - 1) as { data: FacetRij[] | null; error: unknown };

    if (error || !data || data.length === 0) break;

    data.forEach((rij) => {
      const sport = Array.isArray(rij.sports) ? rij.sports[0] : rij.sports;
      if (sport) {
        const huidig = sportTellingen.get(sport.slug);
        sportTellingen.set(sport.slug, { naam: sport.naam, aantal: (huidig?.aantal ?? 0) + 1 });
      }
      const categorie = Array.isArray(rij.categories) ? rij.categories[0] : rij.categories;
      if (categorie) {
        const huidig = categorieTellingen.get(categorie.slug);
        categorieTellingen.set(categorie.slug, { naam: categorie.naam, aantal: (huidig?.aantal ?? 0) + 1 });
      }
    });

    if (data.length < FACET_PAGINA_GROOTTE) break;
  }

  return { sportTellingen, categorieTellingen };
}

export default async function AanbiederProductenPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sport: sportFilter, categorie: categorieFilter, pagina: paginaParam } = await searchParams;
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
    `, { count: "exact" })
    .eq("provider_id", provider.id)
    .eq("actief", true)
    .order("score", { ascending: false });

  if (sportFilter) {
    const { data: sport } = await supabase.from("sports").select("id").eq("slug", sportFilter).single();
    if (sport) query = query.eq("sport_id", sport.id);
  }
  if (categorieFilter) {
    const { data: categorie } = await supabase.from("categories").select("id").eq("slug", categorieFilter).single();
    if (categorie) query = query.eq("category_id", categorie.id);
  }

  const [{ data: sporten }, { data: categorieen }, { sportTellingen, categorieTellingen }] = await Promise.all([
    supabase.from("sports").select("naam, slug").eq("actief", true).order("volgorde"),
    supabase.from("categories").select("naam, slug").order("volgorde"),
    haalProviderFacetten(supabase, provider.id),
  ]);

  // Alleen sporten/categorieën tonen die deze aanbieder ook echt voert.
  const relevanteSporten = (sporten ?? [])
    .filter((s) => sportTellingen.has(s.slug))
    .map((s) => ({ ...s, aantal: sportTellingen.get(s.slug)!.aantal }));
  const relevanteCategorieen = (categorieen ?? [])
    .filter((c) => categorieTellingen.has(c.slug))
    .map((c) => ({ ...c, aantal: categorieTellingen.get(c.slug)!.aantal }));

  const huidigePagina = Math.max(1, parseInt(paginaParam ?? "1", 10) || 1);
  const vanaf = (huidigePagina - 1) * PAGINA_GROOTTE;
  const { data: producten, count } = await query.range(vanaf, vanaf + PAGINA_GROOTTE - 1);

  const totaalProducten = count ?? 0;
  const aantalPaginas = Math.max(1, Math.ceil(totaalProducten / PAGINA_GROOTTE));
  const veiligePagina = Math.min(huidigePagina, aantalPaginas);

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
            {totaalProducten} product{totaalProducten !== 1 ? "en" : ""} — bekijk direct, zonder de configurator te gebruiken.
          </p>

          {/* Filter-link bouwt de query-string op met het andere actieve
              filter behouden, zodat sport + categorie te combineren zijn.
              Een filterwissel reset bewust de paginering. */}
          {(() => {
            function filterHref(volgendeSport?: string, volgendeCategorie?: string) {
              const params = new URLSearchParams();
              if (volgendeSport) params.set("sport", volgendeSport);
              if (volgendeCategorie) params.set("categorie", volgendeCategorie);
              const query = params.toString();
              return `/aanbieders/${slug}${query ? `?${query}` : ""}`;
            }

            return (
              <div className="space-y-3 mb-8">
                {/* Op mobiel horizontaal scrollend i.p.v. wrappen — met
                    veel filters samen zou wrappen alle producten ver onder
                    de vouw duwen op een smal scherm. */}
                {relevanteSporten.length > 1 && (
                  <div className="flex flex-nowrap sm:flex-wrap gap-3 overflow-x-auto sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
                    <Link
                      href={filterHref()}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                        !sportFilter && !categorieFilter ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                      }`}
                    >
                      Alles
                    </Link>
                    {relevanteSporten.map((s) => (
                      <Link
                        key={s.slug}
                        href={filterHref(sportFilter === s.slug ? undefined : s.slug, categorieFilter)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                          sportFilter === s.slug ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                        }`}
                      >
                        {s.naam} <span className="opacity-60">({s.aantal})</span>
                      </Link>
                    ))}
                  </div>
                )}
                {relevanteCategorieen.length > 1 && (
                  <div className="flex flex-nowrap sm:flex-wrap gap-3 overflow-x-auto sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
                    {relevanteCategorieen.map((c) => (
                      <Link
                        key={c.slug}
                        href={filterHref(sportFilter, categorieFilter === c.slug ? undefined : c.slug)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                          categorieFilter === c.slug ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                        }`}
                      >
                        {c.naam} <span className="opacity-60">({c.aantal})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {producten && producten.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {producten.map((product) => {
                  const categorieNaam = Array.isArray(product.categories) ? product.categories[0]?.naam : (product.categories as { naam: string } | null)?.naam;
                  return (
                    <a
                      key={product.id}
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-surface rounded-2xl overflow-hidden group hover:border-brand-gold/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 transition-all duration-300"
                    >
                      <div className="relative h-40 bg-brand-surface flex items-center justify-center overflow-hidden">
                        <ProductAfbeelding
                          src={product.afbeelding_url}
                          alt={product.naam}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        />
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

              {aantalPaginas > 1 && (() => {
                function paginaHref(p: number) {
                  const params = new URLSearchParams();
                  if (sportFilter) params.set("sport", sportFilter);
                  if (categorieFilter) params.set("categorie", categorieFilter);
                  if (p > 1) params.set("pagina", String(p));
                  const query = params.toString();
                  return `/aanbieders/${slug}${query ? `?${query}` : ""}`;
                }

                return (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <Link
                      href={paginaHref(veiligePagina - 1)}
                      aria-disabled={veiligePagina <= 1}
                      className={`px-4 py-2 rounded-lg text-xs font-mono border transition-colors ${
                        veiligePagina <= 1
                          ? "border-brand-border text-brand-muted/30 pointer-events-none"
                          : "border-brand-border text-brand-muted hover:border-brand-gold/40 hover:text-brand-ivory"
                      }`}
                    >
                      ← Vorige
                    </Link>
                    <span className="text-brand-muted text-xs font-mono">
                      Pagina {veiligePagina} van {aantalPaginas}
                    </span>
                    <Link
                      href={paginaHref(veiligePagina + 1)}
                      aria-disabled={veiligePagina >= aantalPaginas}
                      className={`px-4 py-2 rounded-lg text-xs font-mono border transition-colors ${
                        veiligePagina >= aantalPaginas
                          ? "border-brand-border text-brand-muted/30 pointer-events-none"
                          : "border-brand-border text-brand-muted hover:border-brand-gold/40 hover:text-brand-ivory"
                      }`}
                    >
                      Volgende →
                    </Link>
                  </div>
                );
              })()}
            </>
          ) : (
            <p className="text-brand-muted font-body text-sm">Geen producten gevonden met deze filter.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
