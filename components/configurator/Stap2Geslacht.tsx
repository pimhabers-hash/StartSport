"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard, type Geslacht } from "./WizardContext";

const OPTIES: {
  waarde: Geslacht;
  label: string;
  omschrijving: string;
  icoon: string;
}[] = [
  {
    waarde: "man",
    label: "Man",
    omschrijving: "Toon mij heren-uitrusting waar dat een verschil maakt.",
    icoon: "👨",
  },
  {
    waarde: "vrouw",
    label: "Vrouw",
    omschrijving: "Toon mij dames-uitrusting waar dat een verschil maakt.",
    icoon: "👩",
  },
  {
    waarde: "anders",
    label: "Geen voorkeur",
    omschrijving: "Laat het er niet toe doen — toon alles door elkaar.",
    icoon: "🌐",
  },
];

export function Stap2Geslacht() {
  const { state, setGeslacht } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 2 van 6
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Voor wie stellen we{" "}
        <em className="not-italic text-gold-gradient font-light">dit pakket</em> samen?
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Kleding en schoenen vallen vaak anders uit voor heren en dames — dit zorgt dat we je de juiste maatvoering en pasvorm laten zien.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {OPTIES.map((o) => (
          <OptieKaart
            key={o.waarde}
            label={o.label}
            omschrijving={o.omschrijving}
            icoon={o.icoon}
            geselecteerd={state.geslacht === o.waarde}
            onClick={() => setGeslacht(o.waarde)}
          />
        ))}
      </div>
    </div>
  );
}
