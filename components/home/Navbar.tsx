import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-brand-border/60 backdrop-blur-md bg-brand-black/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-xl text-brand-ivory font-semibold tracking-tight">
          Start<em className="not-italic text-gold-gradient">Sport</em>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-body text-brand-muted">
          <Link href="/#sporten" className="hover:text-brand-ivory transition-colors">
            Sporten
          </Link>
          <Link href="/advies" className="hover:text-brand-ivory transition-colors">
            Koopgidsen
          </Link>
          <Link href="/#hoe-het-werkt" className="hover:text-brand-ivory transition-colors">
            Hoe het werkt
          </Link>
          <Link href="/over-ons" className="hover:text-brand-ivory transition-colors">
            Over ons
          </Link>
        </nav>

        {/* CTA */}
        <Link
          href="/configurator"
          className="text-sm font-body font-medium px-5 py-2.5 rounded-lg gold-shimmer text-brand-black hover:opacity-90 transition-opacity"
        >
          Start nu
        </Link>
      </div>
    </header>
  );
}
