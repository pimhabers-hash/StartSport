"use client";

import { OptieKaart } from "./OptieKaart";
import { useWizard } from "./WizardContext";
import type { BinnenBuiten } from "@/lib/supabase/database.types";

const OPTIES: {
  waarde: BinnenBuiten;
  label: string;
  omschrijving: string;
  icoon: string;
}[] = [
  {
    waarde: "buiten",
    label: "Buiten",
    omschrijving: "Ik sport voornamelijk in de buitenlucht.",
    icoon: "☀️",
  },
  {
    waarde: "binnen",
    label: "Binnen",
    omschrijving: "Ik sport in een hal, sportschool of binnenbaan.",
    icoon: "🏢",
  },
  {
    waarde: "beide",
    label: "Beide",
    omschrijving: "Ik wissel af tussen binnen en buiten.",
    icoon: "🔄",
  },
];

export function Stap5BinnenBuiten() {
  const { state, setBinnenBuiten } = useWizard();

  return (
    <div className="animate-fade-up">
      <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
        Stap 5 van 6
      </p>
      <h2 className="font-display text-3xl lg:text-4xl text-brand-ivory mb-2">
        Waar ga je{" "}
        <em className="not-italic text-gold-gradient font-light">sporten?</em>
      </h2>
      <p className="text-brand-muted font-body text-sm mb-8">
        Dit bepaalt welke schoenen en kleding het beste bij je passen.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {OPTIES.map((o) => (
          <OptieKaart
            key={o.waarde}
            label={o.label}
            omschrijving={o.omschrijving}
            icoon={o.icoon}
            geselecteerd={state.binnen_buiten === o.waarde}
            onClick={() => setBinnenBuiten(o.waarde)}
          />
        ))}
      </div>
    </div>
  );
}
