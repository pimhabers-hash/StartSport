"use client";

import { useWizard } from "./WizardContext";

const STAPPEN = [
  { nr: 1, label: "Sport" },
  { nr: 2, label: "Niveau" },
  { nr: 3, label: "Budget" },
  { nr: 4, label: "Gebruik" },
  { nr: 5, label: "Locatie" },
  { nr: 6, label: "Doel" },
];

export function WizardVoortgang() {
  const { state } = useWizard();
  const eersteStap = state.sport !== null ? 2 : 1;

  const zichtbareStappen = STAPPEN.filter((s) => s.nr >= eersteStap);

  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex items-center">
        {zichtbareStappen.map((stap, i) => {
          const actief = state.stap === stap.nr;
          const gedaan = state.stap > stap.nr;
          return (
            <div key={stap.nr} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 flex-shrink-0 ${
                    gedaan
                      ? "bg-brand-gold text-brand-black"
                      : actief
                      ? "border-2 border-brand-gold text-brand-gold"
                      : "border border-brand-border text-brand-muted"
                  }`}
                >
                  {gedaan ? (
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6.5L5 9.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    stap.nr
                  )}
                </div>
                <span className={`text-xs font-mono hidden sm:block transition-colors ${
                  actief ? "text-brand-gold" : gedaan ? "text-brand-ivory" : "text-brand-muted"
                }`}>
                  {stap.label}
                </span>
              </div>
              {i < zichtbareStappen.length - 1 && (
                <div
                  className="flex-1 h-px mx-3 transition-colors duration-500"
                  style={{ background: gedaan ? "#C6A15B" : "#2A2D34" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
