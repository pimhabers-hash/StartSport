"use client";

import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/#sporten", label: "Sporten" },
    { href: "/advies", label: "Koopgidsen" },
    { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
    { href: "/over-ons", label: "Over ons" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-brand-border/60 backdrop-blur-md bg-brand-black/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-xl text-brand-ivory font-semibold tracking-tight">
          Start<em className="not-italic text-gold-gradient">Sport</em>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-body text-brand-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-ivory transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Rechterkant: CTA + mobiel menu-knop */}
        <div className="flex items-center gap-3">
          <Link
            href="/configurator"
            className="text-sm font-body font-medium px-4 sm:px-5 py-2.5 rounded-lg gold-shimmer text-brand-black hover:opacity-90 transition-opacity"
          >
            Start nu
          </Link>

          {/* Hamburger-knop — alleen zichtbaar op mobiel */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-brand-ivory"
            aria-label="Menu openen"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobiel uitklapmenu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-brand-border/60 bg-brand-black/95 backdrop-blur-md px-6 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-brand-ivory text-sm font-body border-b border-brand-border/40 last:border-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
