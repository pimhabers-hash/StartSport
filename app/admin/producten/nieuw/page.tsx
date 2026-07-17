"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

type Optie = { label: string; waarde: string };

const NIVEAUS: Optie[] = [
  { label: "Beginner",   waarde: "beginner" },
  { label: "Gemiddeld",  waarde: "gemiddeld" },
  { label: "Gevorderd",  waarde: "gevorderd" },
  { label: "Competitie", waarde: "competitie" },
];

const BUDGETTEN: Optie[] = [
  { label: "Budget",       waarde: "budget" },
  { label: "Middenklasse", waarde: "middenklasse" },
  { label: "Premium",      waarde: "premium" },
];

const FREQUENTIES: Optie[] = [
  { label: "Recreatief", waarde: "recreatief" },
  { label: "Wekelijks",  waarde: "wekelijks" },
  { label: "Intensief",  waarde: "intensief" },
];

export default function NieuwProductPage() {
  const router = useRouter();
  const supabase = createClient();

  // Dropdownopties uit database
  const [sporten,    setSporten]    = useState<Optie[]>([]);
  const [categorieen, setCategorieen] = useState<Optie[]>([]);
  const [providers,  setProviders]  = useState<Optie[]>([]);

  // Formulier state
  const [naam,          setNaam]          = useState("");
  const [merk,          setMerk]          = useState("");
  const [sportId,       setSportId]       = useState("");
  const [categoryId,    setCategoryId]    = useState("");
  const [providerId,    setProviderId]    = useState("");
  const [prijs,         setPrijs]         = useState("");
  const [budgetklasse,  setBudgetklasse]  = useState("");
  const [affiliateUrl,  setAffiliateUrl]  = useState("");
  const [afbeeldingUrl, setAfbeeldingUrl] = useState("");
  const [uitleg,        setUitleg]        = useState("");
  const [score,         setScore]         = useState("4.0");
  const [actief,        setActief]        = useState(true);

  // Multi-select state
  const [geselecteerdeNiveaus,     setGeselecteerdeNiveaus]     = useState<string[]>([]);
  const [geselecteerdeFrequenties, setGeselecteerdeFrequenties] = useState<string[]>([]);

  const [opslaan,  setOpslaan]  = useState(false);
  const [fout,     setFout]     = useState<string | null>(null);

  useEffect(() => {
    async function laadOpties() {
      const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("categories").select("id, naam").order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
      ]);
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setCategorieen((c ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setProviders((p ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
    }
    laadOpties();
  }, []);

  function toggleNiveau(waarde: string) {
    setGeselecteerdeNiveaus((prev) =>
      prev.includes(waarde) ? prev.filter((v) => v !== waarde) : [...prev, waarde]
    );
  }

  function toggleFrequentie(waarde: string) {
    setGeselecteerdeFrequenties((prev) =>
      prev.includes(waarde) ? prev.filter((v) => v !== waarde) : [...prev, waarde]
    );
  }

  async function handleOpslaan() {
    if (!naam || !sportId || !categoryId || !prijs || !budgetklasse || !affiliateUrl) {
      setFout("Vul alle verplichte velden in.");
      return;
    }
    setOpslaan(true);
    setFout(null);

    const { error } = await supabase.from("products").insert({
      naam,
      merk: merk || null,
      sport_id: sportId,
      category_id: categoryId,
      provider_id: providerId || null,
      prijs: parseFloat(prijs),
      budgetklasse: budgetklasse as "budget" | "middenklasse" | "premium",
      niveau: geselecteerdeNiveaus as ("beginner" | "gemiddeld" | "gevorderd" | "competitie")[],
      geschikt_voor_frequentie: geselecteerdeFrequenties as ("recreatief" | "wekelijks" | "intensief")[],
      affiliate_url: affiliateUrl,
      afbeelding_url: afbeeldingUrl || null,
      uitleg: uitleg || null,
      score: parseFloat(score) || 0,
      actief,
    });

    if (error) {
      setFout(`Fout bij opslaan: ${error.message}`);
      setOpslaan(false);
      return;
    }

    router.push("/admin/producten");
  }

  const CheckboxGroep = ({
    label, opties, geselecteerd, onToggle,
  }: {
    label: string;
    opties: Optie[];
    geselecteerd: string[];
    onToggle: (w: string) => void;
  }) => (
    <div>
      <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opties.map((o) => {
          const aan = geselecteerd.includes(o.waarde);
          return (
            <button
              key={o.waarde}
              type="button"
              onClick={() => onToggle(o.waarde)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                aan
                  ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                  : "border-brand-border text-brand-muted hover:border-brand-gold/40"
              }`}
            >
              {aan && "✓ "}{o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory transition-colors text-sm font-mono">
          ← Terug
        </button>
        <div>
          <h1 className="font-display text-3xl text-brand-ivory">Product toevoegen</h1>
        </div>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-6">
        {/* Basisgegevens */}
        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">
            Basisgegevens
          </p>
          <FormVeld label="Productnaam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} placeholder="bijv. Babolat Pure Drive 2024" />
          <FormVeld label="Merk" naam="merk" waarde={merk} onChange={(v) => setMerk(v as string)} placeholder="bijv. Babolat" />
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Sport" naam="sport" type="select" verplicht waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
            <FormVeld label="Categorie" naam="categorie" type="select" verplicht waarde={categoryId} onChange={(v) => setCategoryId(v as string)} opties={categorieen} />
          </div>
          <FormVeld label="Aanbieder" naam="provider" type="select" waarde={providerId} onChange={(v) => setProviderId(v as string)} opties={providers} />
        </div>

        {/* Prijs & Affiliate */}
        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">
            Prijs & Affiliate
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Prijs (€)" naam="prijs" type="number" verplicht waarde={prijs} onChange={(v) => setPrijs(v as string)} placeholder="49.99" />
            <FormVeld label="Budgetklasse" naam="budget" type="select" verplicht waarde={budgetklasse} onChange={(v) => setBudgetklasse(v as string)} opties={BUDGETTEN} />
          </div>
          <FormVeld label="Affiliate URL" naam="url" type="url" verplicht waarde={affiliateUrl} onChange={(v) => setAffiliateUrl(v as string)} placeholder="https://..." hulptekst="De link naar het product bij de aanbieder (met affiliate-parameter indien van toepassing)" />
        </div>

        {/* Matching */}
        <div className="space-y-5">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">
            Configurator matching
          </p>
          <CheckboxGroep label="Geschikt voor niveau(s)" opties={NIVEAUS} geselecteerd={geselecteerdeNiveaus} onToggle={toggleNiveau} />
          <CheckboxGroep label="Geschikt voor frequentie(s)" opties={FREQUENTIES} geselecteerd={geselecteerdeFrequenties} onToggle={toggleFrequentie} />
        </div>

        {/* Presentatie */}
        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">
            Presentatie
          </p>
          <FormVeld label="Afbeelding URL" naam="afbeelding" type="url" waarde={afbeeldingUrl} onChange={(v) => setAfbeeldingUrl(v as string)} placeholder="https://..." hulptekst="URL van productafbeelding (Supabase Storage of extern)" />
          <FormVeld label="Uitleg voor gebruiker" naam="uitleg" type="textarea" waarde={uitleg} onChange={(v) => setUitleg(v as string)} placeholder="Waarom is dit product geschikt voor de gebruiker?" />
          <FormVeld label="Kwaliteitsscore (0–5)" naam="score" type="number" waarde={score} onChange={(v) => setScore(v as string)} placeholder="4.0" hulptekst="Beïnvloedt de ranking binnen een categorie — hoger scorende producten worden vaker als 'beste match' getoond" />
          <FormVeld label="Actief (zichtbaar in configurator)" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />
        </div>

        {/* Foutmelding */}
        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        {/* Acties */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleOpslaan}
            disabled={opslaan}
            className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40"
          >
            {opslaan ? "Opslaan..." : "Product opslaan"}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm hover:text-brand-ivory transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
