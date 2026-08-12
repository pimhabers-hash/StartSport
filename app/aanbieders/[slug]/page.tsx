import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { ProductAfbeelding } from "@/components/ProductAfbeelding";
import { FilterDropdown } from "@/components/aanbieders/FilterDropdown";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sport?: string; categorie?: string; geslacht?: string; sorteer?: string; pagina?: string }>;
}

const SORTEER_OPTIES = [
  { waarde: "relevantie", label: "Relevantie" },
  { waarde: "prijs-op", label: "Prijs: laag - hoog" },
  { waarde: "prijs-af", label: "Prijs: hoog - laag" },
] as const;

const PAGINA_GROOTTE = 40;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: provider } = await supabase.from("providers").select("naam").eq("slug", slug).single();
  if (!provider) return { title: "Aanbieder — StartSport" };
  return { title: `${provider.naam} — alle producten — StartSport` };
}

/**
 * Welke sporten/categorieën heeft déze aanbieder daadwerkelijk in de
 * catalogus, en hoeveel producten elk? Nodig om de filterknoppen te
 * beperken tot wat relevant is — een aanbieder die alleen padel voert,
 * hoeft geen "Hardlopen"-knop te tonen die toch altijd naar "geen
 * producten" leidt.
 *
 * Telt via losse COUNT-only requests (head:true) per sport/categorie,
 * allemaal tegelijk met Promise.all, in plaats van (zoals eerder) alle
 * duizenden producten van de aanbieder gepagineerd binnenhalen en in JS
 * optellen — dat laatste kostte bij een grote catalogus (11.000+
 * producten bij Decathlon) al gauw 10+ sequentiële round-trips. Een
 * COUNT-query haalt geen rijdata op, alleen het aantal via de
 * Content-Range header, en al die tellingen lopen nu parallel.
 */
async function haalProviderFacetten(
  supabase: Awaited<ReturnType<typeof createClient>>,
  providerId: string,
  alleSporten: { naam: string; slug: string; id: string }[],
  alleCategorieen: { naam: string; slug: string; id: string }[]
) {
  async function telling(kolom: "sport_id" | "category_id", waarde: string) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("actief", true)
      .eq(kolom, waarde);
    return count ?? 0;
  }

  const [sportAantallen, categorieAantallen, manAantal, vrouwAantal] = await Promise.all([
    Promise.all(alleSporten.map((s) => telling("sport_id", s.id))),
    Promise.all(alleCategorieen.map((c) => telling("category_id", c.id))),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("actief", true).eq("geslacht", "man"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("actief", true).eq("geslacht", "vrouw"),
  ]);

  const sportTellingen = new Map<string, { naam: string; aantal: number }>();
  alleSporten.forEach((s, i) => {
    if (sportAantallen[i] > 0) sportTellingen.set(s.slug, { naam: s.naam, aantal: sportAantallen[i] });
  });
  const categorieTellingen = new Map<string, { naam: string; aantal: number }>();
  alleCategorieen.forEach((c, i) => {
    if (categorieAantallen[i] > 0) categorieTellingen.set(c.slug, { naam: c.naam, aantal: categorieAantallen[i] });
  });
  const geslachtTellingen = { man: manAantal.count ?? 0, vrouw: vrouwAantal.count ?? 0 };

  return { sportTellingen, categorieTellingen, geslachtTellingen };
}

export default async function AanbiederProductenPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sport: sportFilter, categorie: categorieFilter, geslacht: geslachtFilter, sorteer: sorteerParam, pagina: paginaParam } = await searchParams;
  const sorteer = SORTEER_OPTIES.some((o) => o.waarde === sorteerParam) ? sorteerParam! : "relevantie";
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, naam, slug")
    .eq("slug", slug)
    .eq("actief", true)
    .single();

  if (!provider) notFound();

  // Sporten/categorieën (met id, voor de filter-lookup hieronder én de
  // facet-tellingen) samen met de facetten zelf ophalen — onafhankelijk
  // van elkaar, dus parallel i.p.v. na elkaar.
  const [{ data: sporten }, { data: categorieen }] = await Promise.all([
    supabase.from("sports").select("id, naam, slug").eq("actief", true).order("volgorde"),
    supabase.from("categories").select("id, naam, slug").order("volgorde"),
  ]);

  // Filter-slug → id opzoeken in de lijst die we toch al hebben, i.p.v.
  // een aparte database-aanroep per actief filter.
  const sportFilterId = sportFilter ? (sporten ?? []).find((s) => s.slug === sportFilter)?.id : undefined;
  const categorieFilterId = categorieFilter ? (categorieen ?? []).find((c) => c.slug === categorieFilter)?.id : undefined;

  let query = supabase
    .from("products")
    .select(`
      id, naam, merk, prijs, afbeelding_url, affiliate_url,
      sports ( naam, slug ),
      categories ( naam, slug )
    `, { count: "exact" })
    .eq("provider_id", provider.id)
    .eq("actief", true);

  if (sorteer === "prijs-op") query = query.order("prijs", { ascending: true });
  else if (sorteer === "prijs-af") query = query.order("prijs", { ascending: false });
  else query = query.order("score", { ascending: false });

  if (sportFilterId) query = query.eq("sport_id", sportFilterId);
  if (categorieFilterId) query = query.eq("category_id", categorieFilterId);
  if (geslachtFilter === "man" || geslachtFilter === "vrouw") {
    query = query.eq("geslacht", geslachtFilter);
  }

  const huidigePagina = Math.max(1, parseInt(paginaParam ?? "1", 10) || 1);
  const vanaf = (huidigePagina - 1) * PAGINA_GROOTTE;

  // Productenpagina en facet-tellingen zijn onafhankelijk van elkaar —
  // ook deze parallel i.p.v. na elkaar ophalen.
  const [{ data: producten, count }, { sportTellingen, categorieTellingen, geslachtTellingen }] = await Promise.all([
    query.range(vanaf, vanaf + PAGINA_GROOTTE - 1),
    haalProviderFacetten(supabase, provider.id, sporten ?? [], categorieen ?? []),
  ]);

  // Alleen sporten/categorieën tonen die deze aanbieder ook echt voert.
  const relevanteSporten = (sporten ?? [])
    .filter((s) => sportTellingen.has(s.slug))
    .map((s) => ({ ...s, aantal: sportTellingen.get(s.slug)!.aantal }));
  const relevanteCategorieen = (categorieen ?? [])
    .filter((c) => categorieTellingen.has(c.slug))
    .map((c) => ({ ...c, aantal: categorieTellingen.get(c.slug)!.aantal }));

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

          {/* Filter-link bouwt de query-string op met de andere actieve
              filters behouden, zodat sport + categorie + geslacht te
              combineren zijn. Een filter- of sorteerwissel reset bewust
              de paginering (nieuwe resultatenset = terug naar pagina 1). */}
          {(() => {
            function hrefMet(overrides: { sport?: string; categorie?: string; geslacht?: string; sorteer?: string }) {
              const waarden = {
                sport: sportFilter, categorie: categorieFilter, geslacht: geslachtFilter, sorteer,
                ...overrides,
              };
              const params = new URLSearchParams();
              if (waarden.sport) params.set("sport", waarden.sport);
              if (waarden.categorie) params.set("categorie", waarden.categorie);
              if (waarden.geslacht) params.set("geslacht", waarden.geslacht);
              if (waarden.sorteer && waarden.sorteer !== "relevantie") params.set("sorteer", waarden.sorteer);
              const query = params.toString();
              return `/aanbieders/${slug}${query ? `?${query}` : ""}`;
            }

            const heeftGeslachtsfilter = geslachtTellingen.man > 0 || geslachtTellingen.vrouw > 0;
            const heeftActiefFilter = Boolean(sportFilter || categorieFilter || geslachtFilter);

            return (
              <div className="space-y-3 mb-8">
                {/* Sport/categorie als uitklapmenu i.p.v. een lange rij
                    pilletjes — bij aanbieders met veel sporten/categorieën
                    (bijv. Decathlon, 20+ sporten) werd die rij onoverzichtelijk
                    en moest je op mobiel horizontaal scrollen om 'm te zien. */}
                <div className="flex flex-wrap items-center gap-3">
                  {relevanteSporten.length > 1 && (
                    <FilterDropdown
                      label="Sport"
                      huidigeLabel={relevanteSporten.find((s) => s.slug === sportFilter)?.naam ?? "Alles"}
                      opties={[
                        { label: "Alles", href: hrefMet({ sport: undefined }), actief: !sportFilter },
                        ...relevanteSporten.map((s) => ({
                          label: s.naam,
                          href: hrefMet({ sport: sportFilter === s.slug ? undefined : s.slug }),
                          actief: sportFilter === s.slug,
                          aantal: s.aantal,
                        })),
                      ]}
                    />
                  )}
                  {relevanteCategorieen.length > 1 && (
                    <FilterDropdown
                      label="Categorie"
                      huidigeLabel={relevanteCategorieen.find((c) => c.slug === categorieFilter)?.naam ?? "Alles"}
                      opties={[
                        { label: "Alles", href: hrefMet({ categorie: undefined }), actief: !categorieFilter },
                        ...relevanteCategorieen.map((c) => ({
                          label: c.naam,
                          href: hrefMet({ categorie: categorieFilter === c.slug ? undefined : c.slug }),
                          actief: categorieFilter === c.slug,
                          aantal: c.aantal,
                        })),
                      ]}
                    />
                  )}
                  {heeftActiefFilter && (
                    <Link
                      href={hrefMet({ sport: undefined, categorie: undefined, geslacht: undefined })}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-brand-muted hover:text-brand-ivory transition-colors"
                    >
                      Filters wissen ✕
                    </Link>
                  )}
                </div>

                {/* Los filter op geslacht en sortering — zoals bij een
                    reguliere webshop, onafhankelijk van sport/categorie. */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-brand-border/60">
                    {heeftGeslachtsfilter && (
                      <div className="flex items-center gap-2">
                        <span className="text-brand-muted text-xs font-mono uppercase tracking-widest">Geslacht</span>
                        <div className="flex flex-wrap gap-2">
                          {geslachtTellingen.man > 0 && (
                            <Link
                              href={hrefMet({ geslacht: geslachtFilter === "man" ? undefined : "man" })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                                geslachtFilter === "man" ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                              }`}
                            >
                              Heren <span className="opacity-60">({geslachtTellingen.man})</span>
                            </Link>
                          )}
                          {geslachtTellingen.vrouw > 0 && (
                            <Link
                              href={hrefMet({ geslacht: geslachtFilter === "vrouw" ? undefined : "vrouw" })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                                geslachtFilter === "vrouw" ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                              }`}
                            >
                              Dames <span className="opacity-60">({geslachtTellingen.vrouw})</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-brand-muted text-xs font-mono uppercase tracking-widest">Sorteren</span>
                      <div className="flex flex-wrap gap-2">
                        {SORTEER_OPTIES.map((o) => (
                          <Link
                            key={o.waarde}
                            href={hrefMet({ sorteer: o.waarde })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                              sorteer === o.waarde ? "border-brand-gold text-brand-gold" : "border-brand-border text-brand-muted"
                            }`}
                          >
                            {o.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
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
                  if (geslachtFilter) params.set("geslacht", geslachtFilter);
                  if (sorteer !== "relevantie") params.set("sorteer", sorteer);
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
