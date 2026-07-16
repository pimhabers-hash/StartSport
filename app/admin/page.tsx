import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard — StartSport" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: aantalSporten },
    { count: aantalProducten },
    { count: aantalKlikken },
    { count: aantalResultaten },
  ] = await Promise.all([
    supabase.from("sports").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("affiliate_clicks").select("*", { count: "exact", head: true }),
    supabase.from("configurator_results").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Sporten",            waarde: aantalSporten ?? 0,    href: "/admin/sporten",   icoon: "🏅" },
    { label: "Producten",          waarde: aantalProducten ?? 0,  href: "/admin/producten", icoon: "📦" },
    { label: "Configuraties",      waarde: aantalResultaten ?? 0, href: "#",                icoon: "⚙️" },
    { label: "Affiliate klikken",  waarde: aantalKlikken ?? 0,    href: "#",                icoon: "🔗" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-brand-ivory mb-1">Dashboard</h1>
        <p className="text-brand-muted text-sm font-body">Overzicht van je StartSport platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card-surface rounded-2xl p-5 hover:border-brand-gold/30 transition-colors">
            <p className="text-2xl mb-2">{stat.icoon}</p>
            <p className="font-mono text-3xl font-medium text-brand-gold">{stat.waarde}</p>
            <p className="text-brand-muted text-xs font-mono mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Snelkoppelingen */}
      <div className="mb-4">
        <h2 className="font-display text-xl text-brand-ivory mb-4">Snelkoppelingen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Sport toevoegen",    href: "/admin/sporten/nieuw",    icoon: "➕" },
            { label: "Product toevoegen",  href: "/admin/producten/nieuw",  icoon: "📦" },
            { label: "Categorie toevoegen",href: "/admin/categorieen/nieuw",icoon: "🏷️" },
            { label: "Aanbieder toevoegen",href: "/admin/providers/nieuw",  icoon: "🏪" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-4 card-surface rounded-xl hover:border-brand-gold/30 transition-colors text-sm font-body text-brand-ivory"
            >
              <span>{link.icoon}</span>
              {link.label}
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 ml-auto text-brand-muted">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
