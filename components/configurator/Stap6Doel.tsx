"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OptieKaart } from "./OptieKaart";
import { useWizard, type Doel } from "./WizardContext";

const DOELEN: { waarde: Doel; label: string; omschrijving: string; icoon: string }[] = [
  { waarde: "sociaal",       label: "Sociaal",         omschrijving: "Ik wil het vooral gezellig hebben en nieuwe mensen ontmoeten.", icoon: "👥" },
  { waarde: "gezond_blijven",label: "Gezond blijven",  omschrijving: "Bewegen voor mijn gezondheid en conditie.", icoon: "💚" },
  { waarde: "afvallen",      label: "Afvallen",        omschrijving: "Ik wil calorieën verbranden en afvallen.", icoon: "🔥" },
  { waarde: "prestatie",     label: "Beter worden",    omschrijving: "Ik wil mijn techniek en prestaties verbeteren.", icoon: "📈" },
  { waarde: "competitie",    label: "Competitie",      omschrijving: "Ik wil wedstrijden spelen en winnen.", icoon: "🏆" },
];

export function Stap6Doel() {
  const { state, setDoel, isCompleet } = useWizard();
  const router = useRouter();
  const [samenstellen, setSamenstellen] = useState(false);

  function handleBereken() {
    if (!isCompleet || !state.sport || samenstellen) return;

    const params = new URLSearchParams({
      sport_id:     state.sport.id,
      sport_slug:   state.sport.slug,
      sport_naam:   state.sport.naam,
      geslacht:     state.geslacht!,
      niveau:       state.niveau!,
      budgetklasse: state.budgetklasse!,
      frequentie:   state.frequentie!,
      doel:         state.doel!,
    });

    // Korte anticipatie vóór de navigatie — laat het voelen alsof we
    // het pakket voor de klant samenstellen, in plaats van een instant
    // page-jump zonder enige overgang.
    setSamenstellen(true);
    setTimeout(() => router.push(`/resultaat?${params.toString()}`), 900);
  }

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 6 van 6
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Wat is je{" "}
        <em className="not-italic text-gold-gradient font-light">doel?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-6">
        Kies wat het beste bij jou past.
      </p>

      {/* Hoofddoel */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        {DOELEN.map((d) => (
          <OptieKaart
            key={d.waarde}
            label={d.label}
            omschrijving={d.omschrijving}
            icoon={d.icoon}
            geselecteerd={state.doel === d.waarde}
            onClick={() => setDoel(d.waarde)}
          />
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleBereken}
        disabled={!isCompleet || samenstellen}
        className={`w-full py-4 rounded-xl font-body font-medium text-sm tracking-wide transition-all duration-300 ${
          isCompleet
            ? "gold-shimmer text-brand-black hover:opacity-90 shadow-lg shadow-brand-gold/20"
            : "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
        }`}
      >
        {samenstellen ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-brand-black/30 border-t-brand-black animate-spin" />
            Jouw pakket wordt samengesteld...
          </span>
        ) : isCompleet ? (
          "Bereken mijn sportpakket →"
        ) : (
          "Kies eerst je doel om door te gaan"
        )}
      </button>
    </div>
  );
}
