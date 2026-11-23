import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  robots: { index: false, follow: false },
};
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin",            label: "Dashboard",   icoon: "📊" },
  { href: "/admin/sporten",    label: "Sporten",     icoon: "🏅" },
  { href: "/admin/producten",  label: "Producten",   icoon: "📦" },
  { href: "/admin/feeds",      label: "Auto-feeds",  icoon: "🔄" },
  { href: "/admin/categorieen",label: "Categorieën", icoon: "🏷️" },
  { href: "/admin/providers",  label: "Aanbieders",  icoon: "🏪" },
  { href: "/admin/artikelen",  label: "Artikelen",   icoon: "📝" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-brand-border flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-brand-border">
          <Link href="/" className="font-display text-lg text-brand-ivory font-semibold">
            Start<em className="not-italic text-gold-gradient">Sport</em>
          </Link>
          <p className="text-brand-muted text-xs font-mono mt-0.5">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-muted text-sm font-body hover:text-brand-ivory hover:bg-brand-surface transition-all"
            >
              <span className="text-base">{item.icoon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Uitloggen */}
        <div className="p-4 border-t border-brand-border">
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-brand-muted text-xs font-mono hover:text-brand-ivory transition-colors"
            >
              Uitloggen →
            </button>
          </form>
          <p className="text-brand-muted text-xs font-mono mt-1 truncate px-3">
            {user.email}
          </p>
        </div>
      </aside>

      {/* Hoofd-inhoud */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
