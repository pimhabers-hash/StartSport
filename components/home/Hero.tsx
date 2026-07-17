"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PAKKET_ITEMS = [
  "Padelracket",
  "Padelballen",
  "Padelschoenen",
  "Sporttas",
  "Grip tape",
  "Bidon",
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7.5" stroke="#C6A15B" strokeWidth="1" />
      <path
        d="M4.5 8.5L7 11L11.5 6"
        stroke="#C6A15B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LivePackagePanel() {
  const [checked, setChecked] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Tik items één voor één af na een korte delay
    const timers: ReturnType<typeof setTimeout>[] = [];

    PAKKET_ITEMS.forEach((_, i) => {
      const t = setTimeout(
        () => {
          setChecked((prev) => [...prev, i]);
          if (i === PAKKET_ITEMS.length - 1) {
            setTimeout(() => setDone(true), 600);
          }
        },
        800 + i * 420
      );
      timers.push(t);
    });

    // Reset na 6 seconden en herhaal
    const reset = setTimeout(
      () => {
        setChecked([]);
        setDone(false);
      },
      800 + PAKKET_ITEMS.length * 420 + 2400
    );
    timers.push(reset);

    return () => timers.forEach(clearTimeout);
  }, [done]);

  return (
    <div className="card-surface rounded-2xl p-6 w-72 shadow-2xl shadow-black/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-0.5">
            Jouw pakket
          </p>
          <p className="text-brand-ivory font-display font-semibold text-lg leading-tight">
            Padel · Starter
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center">
          <span className="text-lg">🎾</span>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-3">
        {PAKKET_ITEMS.map((item, i) => {
          const isChecked = checked.includes(i);
          return (
            <li
              key={item}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: i <= (checked[checked.length - 1] ?? -1) + 1 ? 1 : 0.3 }}
            >
              <span
                className={`transition-all duration-300 ${isChecked ? "animate-check-in" : "opacity-30"}`}
              >
                {isChecked ? (
                  <CheckIcon />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-brand-border block" />
                )}
              </span>
              <span
                className={`text-sm font-body transition-colors duration-300 ${
                  isChecked ? "text-brand-ivory" : "text-brand-muted"
                }`}
              >
                {item}
              </span>
              {isChecked && (
                <span className="ml-auto font-mono text-xs text-brand-gold">
                  ✓
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Totaal */}
      <div
        className={`mt-5 pt-4 border-t border-brand-border flex items-center justify-between transition-opacity duration-500 ${
          done ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-brand-muted text-sm">Totaal</span>
        <span className="font-mono font-medium text-brand-gold text-lg">
          €127,–
        </span>
      </div>
    </div>
  );
}

export function Hero({ aantalSporten }: { aantalSporten: number }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Achtergrond gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(198,161,91,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(198,161,91,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full py-24 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Tekst */}
          <div className="animate-fade-up">
            {/* Eyebrow */}
            <p className="font-mono text-brand-gold text-xs uppercase tracking-[0.2em] mb-6">
              Jouw sport. Jouw uitrusting.
            </p>

            {/* Kop — cursief accent op één woord */}
            <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl leading-[1.05] text-brand-ivory mb-6">
              Begin{" "}
              <em className="not-italic text-gold-gradient font-light">
                direct
              </em>{" "}
              met de juiste uitrusting
            </h1>

            <p className="font-body text-brand-muted text-lg leading-relaxed max-w-md mb-10">
              Geen urenlang vergelijken. Geen overweldigende webshop.
              Vertel ons welke sport, wij stellen het perfecte pakket samen.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/configurator"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-brand-black gold-shimmer hover:opacity-90 transition-opacity text-sm tracking-wide"
              >
                Vind jouw sportpakket
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="#sporten"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-body font-medium text-brand-ivory border border-brand-border hover:border-brand-gold/40 transition-colors text-sm"
              >
                Bekijk alle sporten
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-brand-muted text-xs font-mono">
              Al{" "}
              <span className="text-brand-gold">{aantalSporten} {aantalSporten === 1 ? "sport" : "sporten"}</span>{" "}
              beschikbaar · Gratis · Geen account nodig
            </p>
          </div>

          {/* Pakket-panel */}
          <div className="flex justify-center lg:justify-end" style={{ animationDelay: "0.3s" }}>
            <LivePackagePanel />
          </div>

        </div>
      </div>
    </section>
  );
}
