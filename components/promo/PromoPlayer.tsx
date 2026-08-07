"use client";

import { useEffect, useState } from "react";
import { ProductAfbeelding } from "@/components/ProductAfbeelding";

interface SportData { naam: string; icoon: string | null; }
interface ProductData {
  naam: string;
  merk: string | null;
  prijs: number;
  afbeelding_url: string | null;
  categorie: string;
}

interface PromoPlayerProps {
  sporten: SportData[];
  sportNaam: string;
  producten: ProductData[];
}

const SCENE_DUUR = {
  hero: 4000,
  sporten: 3800,
  configurator: 4200,
  resultaat: 5000,
  outro: 3200,
};

type Scene = keyof typeof SCENE_DUUR;
const VOLGORDE: Scene[] = ["hero", "sporten", "configurator", "resultaat", "outro"];

export function PromoPlayer({ sporten, sportNaam, producten }: PromoPlayerProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [zichtbaar, setZichtbaar] = useState(true);
  const huidigeScene = VOLGORDE[sceneIndex];

  useEffect(() => {
    const duur = SCENE_DUUR[huidigeScene];
    const uitTimer = setTimeout(() => setZichtbaar(false), duur - 400);
    const wisselTimer = setTimeout(() => {
      setSceneIndex((i) => (i + 1) % VOLGORDE.length);
      setZichtbaar(true);
    }, duur);
    return () => {
      clearTimeout(uitTimer);
      clearTimeout(wisselTimer);
    };
  }, [sceneIndex, huidigeScene]);

  const totaalprijs = producten.reduce((sum, p) => sum + p.prijs, 0);

  return (
    <div className="min-h-screen bg-brand-black relative overflow-hidden">
      {/* Geen normale site-navbar — dit scherm is bedoeld om als losse
          video/opname te gebruiken, geen klikbare site-chrome erin. */}
      <div className="fixed top-11 sm:top-14 left-6 sm:left-12 z-20 font-display text-lg text-brand-ivory font-semibold tracking-tight">
        Start<em className="not-italic text-gold-gradient">Sport</em>
      </div>

      {/* Scène-voortgang, als "stories"-balkjes — geeft de video meteen
          een geproduceerde, herkenbare pacing i.p.v. een stille dia-show. */}
      <div className="fixed top-6 inset-x-6 sm:inset-x-12 flex gap-1.5 z-20">
        {VOLGORDE.map((s, i) => (
          <div key={s} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={
                i < sceneIndex
                  ? "h-full w-full bg-brand-gold rounded-full"
                  : i === sceneIndex
                  ? "h-full w-0 bg-brand-gold rounded-full animate-promo-voortgang"
                  : "h-full w-0 bg-brand-gold rounded-full"
              }
              style={i === sceneIndex ? { animationDuration: `${SCENE_DUUR[s]}ms` } : undefined}
            />
          </div>
        ))}
      </div>

      <main className="min-h-screen flex items-center justify-center px-6 pt-16 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-bg-drift"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(198,161,91,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(198,161,91,0.05) 0%, transparent 60%)",
          }}
        />

        <div
          className="relative z-10 w-full max-w-2xl transition-all duration-500 ease-out"
          style={{
            opacity: zichtbaar ? 1 : 0,
            transform: zichtbaar ? "scale(1)" : "scale(0.98)",
          }}
        >
          {huidigeScene === "hero" && <SceneHero />}
          {huidigeScene === "sporten" && <SceneSporten sporten={sporten} />}
          {huidigeScene === "configurator" && <SceneConfigurator sportNaam={sportNaam} />}
          {huidigeScene === "resultaat" && (
            <SceneResultaat sportNaam={sportNaam} producten={producten} totaalprijs={totaalprijs} />
          )}
          {huidigeScene === "outro" && <SceneOutro />}
        </div>
      </main>
    </div>
  );
}

function SceneHero() {
  return (
    <div className="text-center animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-[0.2em] mb-6">
        Jouw sport. Jouw uitrusting.
      </p>
      <h1 className="font-display text-5xl lg:text-6xl leading-[1.05] text-brand-ivory mb-6">
        Begin{" "}
        <em className="not-italic text-gold-gradient font-light">direct</em>{" "}
        met de juiste uitrusting
      </h1>
      <p className="font-body text-brand-muted text-lg leading-relaxed max-w-md mx-auto">
        Geen urenlang vergelijken. Vertel ons welke sport, wij stellen het perfecte pakket samen.
      </p>
    </div>
  );
}

function SceneSporten({ sporten }: { sporten: SportData[] }) {
  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-[0.2em] mb-3 text-center">
        Beschikbare sporten
      </p>
      <h2 className="font-display text-4xl text-brand-ivory text-center mb-8">
        Kies jouw <em className="not-italic text-gold-gradient font-light">sport</em>
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {sporten.map((s, i) => (
          <div
            key={s.naam}
            className={`card-surface rounded-2xl p-6 transition-all duration-500 ${
              i === 0 ? "!border-brand-gold shadow-lg shadow-brand-gold/10 animate-glow-pulse" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-surface flex items-center justify-center text-2xl mb-3">
              {s.icoon ?? "🏅"}
            </div>
            <p className="font-display font-semibold text-brand-ivory">{s.naam}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneConfigurator({ sportNaam }: { sportNaam: string }) {
  const niveaus = ["Beginner", "Gemiddeld", "Gevorderd", "Competitie"];
  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 2 van 6
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Wat is je <em className="not-italic text-gold-gradient font-light">niveau?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Dit helpt ons het juiste materiaal voor je te kiezen.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {niveaus.map((n, i) => (
          <div
            key={n}
            className={`rounded-xl p-5 border transition-all duration-200 ${
              i === 0
                ? "border-brand-gold bg-brand-gold/5 shadow-lg shadow-brand-gold/10 animate-glow-pulse"
                : "border-brand-border bg-brand-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-display font-semibold ${i === 0 ? "text-brand-gold" : "text-brand-ivory"}`}>
                {n}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                i === 0 ? "border-brand-gold bg-brand-gold" : "border-brand-border"
              }`}>
                {i === 0 && (
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path d="M2 5.5L4.5 8L8.5 3" stroke="#0A0B0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneResultaat({
  sportNaam,
  producten,
  totaalprijs,
}: {
  sportNaam: string;
  producten: ProductData[];
  totaalprijs: number;
}) {
  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3 text-center">
        Jouw persoonlijke pakket
      </p>
      <h2 className="font-display text-3xl text-brand-ivory text-center mb-8">
        {sportNaam} · <em className="not-italic text-gold-gradient font-light">Beginner</em>
      </h2>

      {producten.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {producten.map((p, i) => (
              <div
                key={p.naam}
                className="card-surface rounded-2xl overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="relative h-28 bg-brand-surface flex items-center justify-center">
                  <ProductAfbeelding src={p.afbeelding_url} alt={p.naam} sizes="200px" />
                </div>
                <div className="p-3">
                  <p className="text-brand-gold text-[10px] font-mono uppercase tracking-widest mb-1">{p.categorie}</p>
                  <p className="text-brand-ivory text-xs font-body leading-snug line-clamp-2 mb-1">{p.naam}</p>
                  <p className="font-mono text-brand-gold text-sm">€{p.prijs.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
            ))}
          </div>
          <div
            className="flex items-center justify-between px-5 py-3 rounded-xl border border-brand-gold/30 animate-fade-up"
            style={{ animationDelay: `${producten.length * 120 + 150}ms` }}
          >
            <span className="text-brand-muted text-sm font-body">Totaal</span>
            <span className="font-mono text-brand-gold text-2xl font-medium">
              €{totaalprijs.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </>
      ) : (
        <p className="text-brand-muted text-center font-body text-sm">
          (Voeg producten toe aan {sportNaam} om deze scène te vullen)
        </p>
      )}
    </div>
  );
}

function SceneOutro() {
  return (
    <div className="text-center animate-fade-up relative">
      <div
        aria-hidden
        className="absolute -inset-x-20 -inset-y-16 -z-10 opacity-60"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(198,161,91,0.18) 0%, transparent 70%)",
        }}
      />
      <p className="font-display text-4xl text-brand-ivory font-semibold tracking-tight mb-6">
        Start<em className="not-italic text-gold-gradient">Sport</em>
      </p>
      <p className="font-body text-brand-muted text-lg mb-8">
        Vind jouw sportpakket in 2 minuten.
      </p>
      <div className="inline-flex items-center gap-2 px-8 py-4 rounded-xl gold-shimmer text-brand-black text-sm font-medium">
        startsport.nl
      </div>
    </div>
  );
}
