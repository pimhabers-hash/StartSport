"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard } from "./WizardContext";
import type { GebruikFrequentie } from "@/lib/supabase/database.types";

const FREQUENTIES: {
  waarde: GebruikFrequentie;
  label: string;
  omschrijving: string;
  icoon: string;
}[] = [
  { waarde: "recreatief", label: "Recreatief", omschrijving: "Af en toe, voor de lol. Geen vaste planning.", icoon: "😎" },
  { waarde: "wekelijks",  label: "Wekelijks",  omschrijving: "1–3 keer per week, structureel.", icoon: "📅" },
  { waarde: "intensief",  label: "Intensief",  omschrijving: "Meerdere keren per week, serieus bezig.", icoon: "🔥" },
];

export function Stap4Frequentie() {
  const { state, setFrequentie } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 4 van 6
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Hoe vaak ga je{" "}
        <em className="not-italic text-gold-gradient font-light">sporten?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Dit bepaalt hoe duurzaam het materiaal moet zijn.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {FREQUENTIES.map((f) => (
          <OptieKaart
            key={f.waarde}
            label={f.label}
            omschrijving={f.omschrijving}
            icoon={f.icoon}
            geselecteerd={state.frequentie === f.waarde}
            onClick={() => setFrequentie(f.waarde)}
          />
        ))}
      </div>
    </div>
  );
}
