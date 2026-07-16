import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
          <div>
            <span className="font-display text-xl text-brand-ivory font-semibold tracking-tight">
              Start<em className="not-italic text-gold-gradient">Sport</em>
            </span>
            <p className="text-brand-muted text-xs font-mono mt-1">
              Jouw sport. Jouw uitrusting.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-muted font-body">
            <Link href="/sporten" className="hover:text-brand-ivory transition-colors">Sporten</Link>
            <Link href="/configurator" className="hover:text-brand-ivory transition-colors">Configurator</Link>
            <Link href="/admin" className="hover:text-brand-ivory transition-colors">Admin</Link>
          </nav>
        </div>

        {/* Juridische links */}
        <div className="border-t border-brand-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-muted font-mono">
            <Link href="/privacy" className="hover:text-brand-gold transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-brand-gold transition-colors">Cookies</Link>
            <Link href="/affiliate-disclaimer" className="hover:text-brand-gold transition-colors">Affiliate disclaimer</Link>
            <Link href="/contact" className="hover:text-brand-gold transition-colors">Contact</Link>
          </nav>
          <p className="text-brand-muted text-xs font-mono">
            © {new Date().getFullYear()} StartSport
          </p>
        </div>
      </div>
    </footer>
  );
}
