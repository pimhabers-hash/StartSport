"use client";

import { WizardProvider, useWizard, type WizardSport } from "./WizardContext";
import { WizardVoortgang } from "./WizardVoortgang";
import { Stap1Sport } from "./Stap1Sport";
import { Stap2Geslacht } from "./Stap2Geslacht";
import { Stap3Niveau } from "./Stap3Niveau";
import { Stap4Budget } from "./Stap4Budget";
import { Stap5Frequentie } from "./Stap5Frequentie";
import { Stap6Doel } from "./Stap6Doel";

function WizardInhoud({ sporten }: { sporten: WizardSport[] }) {
  const { state, vorigeStap } = useWizard();
  const eersteStap = state.sport !== null && state.stap >= 2 ? 2 : 1;

  const STAP_LABELS: Record<string, string> = {
    man: "Man", vrouw: "Vrouw", anders: "Geen voorkeur",
    beginner: "Beginner", gemiddeld: "Gemiddeld",
    gevorderd: "Gevorderd", competitie: "Competitie",
    budget: "Budget", middenklasse: "Middenklasse", premium: "Premium",
    recreatief: "Recreatief", wekelijks: "Wekelijks", intensief: "Intensief",
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-16 px-6">
      <div className="max-w-xl mx-auto">
        <WizardVoortgang />

        <div className="card-surface rounded-2xl p-8">
          {state.stap === 1 && <Stap1Sport sporten={sporten} />}
          {state.stap === 2 && <Stap2Geslacht />}
          {state.stap === 3 && <Stap3Niveau />}
          {state.stap === 4 && <Stap4Budget />}
          {state.stap === 5 && <Stap5Frequentie />}
          {state.stap === 6 && <Stap6Doel />}

          {state.stap > eersteStap && (
            <button
              onClick={vorigeStap}
              className="mt-6 flex items-center gap-2 text-brand-muted text-sm font-body hover:text-brand-ivory transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Vorige stap
            </button>
          )}
        </div>

        {/* Samenvatting chips */}
        {state.stap > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {state.sport     && <Chip label={state.sport.naam} />}
            {state.geslacht  && <Chip label={STAP_LABELS[state.geslacht] ?? state.geslacht} />}
            {state.niveau    && <Chip label={STAP_LABELS[state.niveau] ?? state.niveau} />}
            {state.budgetklasse && <Chip label={STAP_LABELS[state.budgetklasse] ?? state.budgetklasse} />}
            {state.frequentie && <Chip label={STAP_LABELS[state.frequentie] ?? state.frequentie} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full border border-brand-gold/30 text-brand-gold text-xs font-mono capitalize">
      {label}
    </span>
  );
}

export function Wizard({
  sporten,
  initieSport,
}: {
  sporten: WizardSport[];
  initieSport?: WizardSport;
}) {
  return (
    <WizardProvider initieSport={initieSport}>
      <WizardInhoud sporten={sporten} />
    </WizardProvider>
  );
}
