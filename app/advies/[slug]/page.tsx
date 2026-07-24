import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface FaqItem {
  vraag: string;
  antwoord: string;
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
    .select(`
      titel, samenvatting, inhoud, created_at, sport_id,
      auteur_naam, auteur_rol, auteur_bio, laatst_bijgewerkt, faq,
      sports ( naam, slug )
    `)
    .eq("slug", slug)
    .eq("gepubliceerd", true)
    .single();

  if (!artikel) notFound();

  const sport = Array.isArray(artikel.sports) ? artikel.sports[0] : artikel.sports as { naam: string; slug: string } | null;
  const paragrafen = artikel.inhoud.split(/\n\s*\n/).filter((p: string) => p.trim());
  const faqItems: FaqItem[] = Array.isArray(artikel.faq) ? artikel.faq : [];

  // Gerelateerde artikelen ophalen: andere gidsen voor dezelfde sport
  const { data: gerelateerd } = sport
    ? await supabase
        .from("articles")
        .select("titel, slug, samenvatting")
        .eq("sport_id", artikel.sport_id)
        .eq("gepubliceerd", true)
        .neq("slug", slug)
        .limit(3)
    : { data: null };

  // Structured data: Article schema — geeft Google expliciete
  // auteur/datum-signalen (E-E-A-T), belangrijk voor vertrouwen en SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artikel.titel,
    description: artikel.samenvatting,
    author: {
      "@type": "Person",
      name: artikel.auteur_naam ?? "StartSport Redactie",
      jobTitle: artikel.auteur_rol ?? "Redactie",
    },
    publisher: {
      "@type": "Organization",
      name: "StartSport",
    },
    datePublished: artikel.created_at,
    dateModified: artikel.laatst_bijgewerkt ?? artikel.created_at,
  };

  // FAQ schema — kans op featured snippets in Google, en toont diepgang
  const faqSchema = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.vraag,
      acceptedAnswer: { "@type": "Answer", text: item.antwoord },
    })),
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://startsport.nl" },
      { "@type": "ListItem", position: 2, name: "Koopgidsen", item: "https://startsport.nl/advies" },
      { "@type": "ListItem", position: 3, name: artikel.titel, item: `https://startsport.nl/advies/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <article className="max-w-2xl mx-auto">

          {/* Breadcrumb zichtbaar */}
          <nav className="text-xs font-mono text-brand-muted mb-6">
            <Link href="/" className="hover:text-brand-ivory transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/advies" className="hover:text-brand-ivory transition-colors">Koopgidsen</Link>
            {sport && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/sporten/${sport.slug}`} className="hover:text-brand-ivory transition-colors">{sport.naam}</Link>
              </>
            )}
          </nav>

          {sport && (
            <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">{sport.naam}</p>
          )}
          <h1 className="font-display text-4xl text-brand-ivory mb-4 leading-tight">{artikel.titel}</h1>
          <p className="text-brand-muted font-body text-base mb-6 leading-relaxed">{artikel.samenvatting}</p>

          {/* Auteur / E-E-A-T blok — zichtbaar vertrouwenssignaal */}
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-brand-border">
            <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-gold font-display font-semibold">
              {(artikel.auteur_naam ?? "S").charAt(0)}
            </div>
            <div>
              <p className="text-brand-ivory text-sm font-body">
                {artikel.auteur_naam ?? "StartSport Redactie"}
                {artikel.auteur_rol && <span className="text-brand-muted"> — {artikel.auteur_rol}</span>}
              </p>
              <p className="text-brand-muted text-xs font-mono">
                Laatst bijgewerkt:{" "}
                {new Date(artikel.laatst_bijgewerkt ?? artikel.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="space-y-5 text-brand-ivory/90 font-body text-[15px] leading-relaxed">
            {paragrafen.map((p: string, i: number) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </div>

          {/* FAQ sectie */}
          {faqItems.length > 0 && (
            <div className="mt-14 border-t border-brand-border pt-10">
              <h2 className="font-display text-2xl text-brand-ivory mb-6">Veelgestelde vragen</h2>
              <div className="space-y-6">
                {faqItems.map((item, i) => (
                  <div key={i}>
                    <h3 className="text-brand-ivory font-body font-medium mb-2">{item.vraag}</h3>
                    <p className="text-brand-muted text-sm font-body leading-relaxed">{item.antwoord}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auteur-bio onderaan */}
          {artikel.auteur_bio && (
            <div className="mt-12 p-5 card-surface rounded-2xl">
              <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Over de auteur</p>
              <p className="text-brand-ivory text-sm font-body leading-relaxed">{artikel.auteur_bio}</p>
            </div>
          )}

          {/* CTA naar configurator */}
          {sport && (
            <div className="mt-8 p-6 card-surface rounded-2xl text-center">
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

          {/* Gerelateerde artikelen — interne links, belangrijk voor SEO en journey */}
          {gerelateerd && gerelateerd.length > 0 && (
            <div className="mt-14 border-t border-brand-border pt-10">
              <h2 className="font-display text-xl text-brand-ivory mb-6">Lees ook</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {gerelateerd.map((g) => (
                  <Link key={g.slug} href={`/advies/${g.slug}`} className="card-surface rounded-xl p-4 hover:border-brand-gold/30 transition-colors">
                    <p className="text-brand-ivory text-sm font-body mb-1">{g.titel}</p>
                    <p className="text-brand-muted text-xs font-body line-clamp-2">{g.samenvatting}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
