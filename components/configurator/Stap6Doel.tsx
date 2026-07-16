"use client";

import { useRouter } from "next/navigation";
import { OptieKaart } from "./OptieKaart";
import { useWizard, type Doel, type LeeftijdCategorie, type Geslacht } from "./WizardContext";

const DOELEN: { waarde: Doel; label: string; omschrijving: string; icoon: string }[] = [
  { waarde: "sociaal",       label: "Sociaal",         omschrijving: "Ik wil het vooral gezellig hebben en nieuwe mensen ontmoeten.", icoon: "👥" },
  { waarde: "gezond_blijven",label: "Gezond blijven",  omschrijving: "Bewegen voor mijn gezondheid en conditie.", icoon: "💚" },
  { waarde: "afvallen",      label: "Afvallen",        omschrijving: "Ik wil calorieën verbranden en afvallen.", icoon: "🔥" },
  { waarde: "prestatie",     label: "Beter worden",    omschrijving: "Ik wil mijn techniek en prestaties verbeteren.", icoon: "📈" },
  { waarde: "competitie",    label: "Competitie",      omschrijving: "Ik wil wedstrijden spelen en winnen.", icoon: "🏆" },
];

const LEEFTIJDEN: { waarde: LeeftijdCategorie; label: string }[] = [
  { waarde: "junior",     label: "Junior (t/m 17)" },
  { waarde: "volwassene", label: "Volwassene (18–59)" },
  { waarde: "senior",     label: "Senior (60+)" },
];

const GESLACHTEN: { waarde: Geslacht; label: string }[] = [
  { waarde: "man",    label: "Man" },
  { waarde: "vrouw",  label: "Vrouw" },
  { waarde: "anders", label: "Anders / geen voorkeur" },
];

export function Stap6Doel() {
  const { state, setDoel, setLeeftijd, setGeslacht, isCompleet } = useWizard();
  const router = useRouter();

  function handleBereken() {
    if (!isCompleet || !state.sport) return;

    const params = new URLSearchParams({
      sport_id:     state.sport.id,
      sport_slug:   state.sport.slug,
      sport_naam:   state.sport.naam,
      niveau:       state.niveau!,
      budgetklasse: state.budgetklasse!,
      frequentie:   state.frequentie!,
      binnen_buiten: state.binnen_buiten!,
      doel:         state.doel!,
      ...(state.leeftijd  ? { leeftijd:  state.leeftijd }  : {}),
      ...(state.geslacht  ? { geslacht:  state.geslacht }  : {}),
    });

    router.push(`/resultaat?${params.toString()}`);
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

      {/* Optionele vragen */}
      <div className="border-t border-brand-border pt-6 mb-8 space-y-5">
        <p className="text-brand-muted text-xs font-mono uppercase tracking-widest">
          Optioneel — voor nog betere aanbevelingen
        </p>

        {/* Leeftijd */}
        <div>
          <p className="text-brand-ivory text-sm font-body mb-3">Leeftijdscategorie</p>
          <div className="flex flex-wrap gap-2">
            {LEEFTIJDEN.map((l) => (
              <button
                key={l.waarde}
                onClick={() => setLeeftijd(l.waarde)}
                className={`px-4 py-2 rounded-xl text-sm font-body border transition-all ${
                  state.leeftijd === l.waarde
                    ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                    : "border-brand-border text-brand-muted hover:border-brand-gold/40"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Geslacht */}
        <div>
          <p className="text-brand-ivory text-sm font-body mb-3">Geslacht</p>
          <div className="flex flex-wrap gap-2">
            {GESLACHTEN.map((g) => (
              <button
                key={g.waarde}
                onClick={() => setGeslacht(g.waarde)}
                className={`px-4 py-2 rounded-xl text-sm font-body border transition-all ${
                  state.geslacht === g.waarde
                    ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                    : "border-brand-border text-brand-muted hover:border-brand-gold/40"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleBereken}
        disabled={!isCompleet}
        className={`w-full py-4 rounded-xl font-body font-medium text-sm tracking-wide transition-all duration-300 ${
          isCompleet
            ? "gold-shimmer text-brand-black hover:opacity-90 shadow-lg shadow-brand-gold/20"
            : "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
        }`}
      >
        {isCompleet
          ? "Bereken mijn sportpakket →"
          : "Kies eerst je doel om door te gaan"}
      </button>
    </div>
  );
}
