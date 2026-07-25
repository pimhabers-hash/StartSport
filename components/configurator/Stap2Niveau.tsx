"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard } from "./WizardContext";
import type { ErvaringNiveau } from "@/lib/supabase/database.types";

const NIVEAUS: {
  waarde: ErvaringNiveau;
  label: string;
  omschrijving: string;
  icoon: string;
}[] = [
  {
    waarde: "beginner",
    label: "Beginner",
    omschrijving: "Ik begin pril. Geen of weinig ervaring.",
    icoon: "🌱",
  },
  {
    waarde: "gemiddeld",
    label: "Gemiddeld",
    omschrijving: "Ik speel al een tijdje en ken de basis.",
    icoon: "📈",
  },
  {
    waarde: "gevorderd",
    label: "Gevorderd",
    omschrijving: "Ik speel regelmatig en wil beter materiaal.",
    icoon: "⚡",
  },
  {
    waarde: "competitie",
    label: "Competitie",
    omschrijving: "Ik speel wedstrijden en wil topprestaties.",
    icoon: "🏆",
  },
];

export function Stap2Niveau() {
  const { state, setNiveau } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 2 van 4
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Wat is je{" "}
        <em className="not-italic text-gold-gradient font-light">niveau?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Dit helpt ons het juiste materiaal voor je te kiezen.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NIVEAUS.map((n) => (
          <OptieKaart
            key={n.waarde}
            label={n.label}
            omschrijving={n.omschrijving}
            icoon={n.icoon}
            geselecteerd={state.niveau === n.waarde}
            onClick={() => setNiveau(n.waarde)}
          />
        ))}
      </div>
    </div>
  );
}
