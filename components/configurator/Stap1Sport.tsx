"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard, type WizardSport } from "./WizardContext";

const SPORT_EMOJI: Record<string, string> = {
  padel: "🎾", tennis: "🎾", hardlopen: "👟",
  fitness: "🏋️", volleybal: "🏐", golf: "⛳",
  pickleball: "🏓", schermen: "🤺",
};

interface Stap1SportProps {
  sporten: WizardSport[];
}

export function Stap1Sport({ sporten }: Stap1SportProps) {
  const { state, setSport } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 1 van 4
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Welke sport wil je{" "}
        <em className="not-italic text-gold-gradient font-light">beginnen?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Kies de sport waarvoor je een uitrusting wilt samenstellen.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sporten.map((sport) => (
          <OptieKaart
            key={sport.id}
            label={sport.naam}
            icoon={SPORT_EMOJI[sport.slug] ?? "🏅"}
            geselecteerd={state.sport?.id === sport.id}
            onClick={() => setSport(sport)}
          />
        ))}
      </div>
    </div>
  );
}
