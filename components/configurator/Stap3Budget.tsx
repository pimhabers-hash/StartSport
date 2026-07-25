"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard } from "./WizardContext";
import type { BudgetKlasse } from "@/lib/supabase/database.types";

const BUDGETTEN: {
  waarde: BudgetKlasse;
  label: string;
  omschrijving: string;
  indicatie: string;
  icoon: string;
}[] = [
  {
    waarde: "budget",
    label: "Budget",
    omschrijving: "Goed beginnermateriaal zonder onnodige franje.",
    indicatie: "~€50 – €150",
    icoon: "💶",
  },
  {
    waarde: "middenklasse",
    label: "Middenklasse",
    omschrijving: "Betere kwaliteit, comfortabeler en duurzamer.",
    indicatie: "~€150 – €350",
    icoon: "💳",
  },
  {
    waarde: "premium",
    label: "Premium",
    omschrijving: "Het beste materiaal voor serieuze sporters.",
    indicatie: "€350+",
    icoon: "💎",
  },
];

export function Stap3Budget() {
  const { state, setBudgetklasse } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 3 van 4
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Wat is je{" "}
        <em className="not-italic text-gold-gradient font-light">budget?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        De indicaties zijn voor het totale startpakket.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {BUDGETTEN.map((b) => (
          <div key={b.waarde} className="relative">
            <OptieKaart
              label={b.label}
              omschrijving={b.omschrijving}
              icoon={b.icoon}
              geselecteerd={state.budgetklasse === b.waarde}
              onClick={() => setBudgetklasse(b.waarde)}
            />
            {/* Prijs-badge */}
            <span className="absolute top-4 right-12 font-mono text-xs text-brand-gold opacity-70">
              {b.indicatie}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
