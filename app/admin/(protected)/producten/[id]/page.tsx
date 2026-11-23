"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function BewerkProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden,         setLaden]         = useState(true);
  const [opslaan,       setOpslaan]       = useState(false);
  const [verwijderen,   setVerwijderen]   = useState(false);
  const [fout,          setFout]          = useState<string | null>(null);

  // Dropdownopties
  const [sporten,     setSporten]     = useState<Optie[]>([]);
  const [categorieen, setCategorieen] = useState<Optie[]>([]);
  const [providers,   setProviders]   = useState<Optie[]>([]);

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
  const [geselecteerdeNiveaus,     setGeselecteerdeNiveaus]     = useState<string[]>([]);
  const [geselecteerdeFrequenties, setGeselecteerdeFrequenties] = useState<string[]>([]);

  useEffect(() => {
    async function laadData() {
      const [{ data: product }, { data: s }, { data: c }, { data: p }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
        supabase.from("categories").select("id, naam").order("volgorde"),
        supabase.from("providers").select("id, naam").eq("actief", true),
      ]);

      if (product) {
        setNaam(product.naam);
        setMerk(product.merk ?? "");
        setSportId(product.sport_id);
        setCategoryId(product.category_id);
        setProviderId(product.provider_id ?? "");
        setPrijs(String(product.prijs));
        setBudgetklasse(product.budgetklasse);
        setAffiliateUrl(product.affiliate_url);
        setAfbeeldingUrl(product.afbeelding_url ?? "");
        setUitleg(product.uitleg ?? "");
        setScore(String(product.score ?? 4.0));
        setActief(product.actief);
        setGeselecteerdeNiveaus(product.niveau ?? []);
        setGeselecteerdeFrequenties(product.geschikt_voor_frequentie ?? []);
      }

      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setCategorieen((c ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setProviders((p ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setLaden(false);
    }
    laadData();
  }, [id]);

  function toggleNiveau(w: string) {
    setGeselecteerdeNiveaus((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }
  function toggleFrequentie(w: string) {
    setGeselecteerdeFrequenties((prev) => prev.includes(w) ? prev.filter((v) => v !== w) : [...prev, w]);
  }

  async function handleOpslaan() {
    if (!naam || !sportId || !categoryId || !prijs || !budgetklasse || !affiliateUrl) {
      setFout("Vul alle verplichte velden in."); return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("products").update({
      naam, merk: merk || null,
      sport_id: sportId, category_id: categoryId,
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
      geclassificeerd: true,
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/producten");
  }

  async function handleVerwijderen() {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    setVerwijderen(true);
    await supabase.from("products").delete().eq("id", id);
    router.push("/admin/producten");
  }

  const CheckboxGroep = ({ label, opties, geselecteerd, onToggle }: {
    label: string; opties: Optie[]; geselecteerd: string[]; onToggle: (w: string) => void;
  }) => (
    <div>
      <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opties.map((o) => {
          const aan = geselecteerd.includes(o.waarde);
          return (
            <button key={o.waarde} type="button" onClick={() => onToggle(o.waarde)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                aan ? "border-brand-gold bg-brand-gold/10 text-brand-gold" : "border-brand-border text-brand-muted hover:border-brand-gold/40"
              }`}>
              {aan && "✓ "}{o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (laden) {
    return <div className="text-brand-muted font-mono text-sm animate-pulse">Product laden...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Product bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-6">
        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">Basisgegevens</p>
          <FormVeld label="Productnaam" naam="naam" verplicht waarde={naam} onChange={(v) => setNaam(v as string)} />
          <FormVeld label="Merk" naam="merk" waarde={merk} onChange={(v) => setMerk(v as string)} />
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Sport" naam="sport" type="select" verplicht waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
            <FormVeld label="Categorie" naam="categorie" type="select" verplicht waarde={categoryId} onChange={(v) => setCategoryId(v as string)} opties={categorieen} />
          </div>
          <FormVeld label="Aanbieder" naam="provider" type="select" waarde={providerId} onChange={(v) => setProviderId(v as string)} opties={providers} />
        </div>

        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">Prijs & Affiliate</p>
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Prijs (€)" naam="prijs" type="number" verplicht waarde={prijs} onChange={(v) => setPrijs(v as string)} />
            <FormVeld label="Budgetklasse" naam="budget" type="select" verplicht waarde={budgetklasse} onChange={(v) => setBudgetklasse(v as string)} opties={BUDGETTEN} />
          </div>
          <FormVeld label="Affiliate URL" naam="url" type="url" verplicht waarde={affiliateUrl} onChange={(v) => setAffiliateUrl(v as string)} />
        </div>

        <div className="space-y-5">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">Configurator matching</p>
          <CheckboxGroep label="Geschikt voor niveau(s)" opties={NIVEAUS} geselecteerd={geselecteerdeNiveaus} onToggle={toggleNiveau} />
          <CheckboxGroep label="Geschikt voor frequentie(s)" opties={FREQUENTIES} geselecteerd={geselecteerdeFrequenties} onToggle={toggleFrequentie} />
        </div>

        <div className="space-y-4">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest border-b border-brand-border pb-2">Presentatie</p>
          <FormVeld label="Afbeelding URL" naam="afbeelding" type="url" waarde={afbeeldingUrl} onChange={(v) => setAfbeeldingUrl(v as string)} />
          <FormVeld label="Uitleg voor gebruiker" naam="uitleg" type="textarea" waarde={uitleg} onChange={(v) => setUitleg(v as string)} />
          <FormVeld label="Kwaliteitsscore (0–5)" naam="score" type="number" waarde={score} onChange={(v) => setScore(v as string)} hulptekst="Beïnvloedt de ranking binnen een categorie" />
          <FormVeld label="Actief" naam="actief" type="checkbox" waarde={actief} onChange={(v) => setActief(v as boolean)} />
        </div>

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={handleOpslaan} disabled={opslaan}
            className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm hover:text-brand-ivory transition-colors">
            Annuleren
          </button>
        </div>

        {/* Gevaarzone */}
        <div className="border-t border-brand-border pt-6">
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">Gevaarzone</p>
          <button onClick={handleVerwijderen} disabled={verwijderen}
            className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/10 transition-colors disabled:opacity-40">
            {verwijderen ? "Verwijderen..." : "Product verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
