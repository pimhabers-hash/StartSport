"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

export default function NieuwArtikelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [titel, setTitel] = useState("");
  const [slug, setSlug] = useState("");
  const [samenvatting, setSamenvatting] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [sportId, setSportId] = useState("");
  const [gepubliceerd, setGepubliceerd] = useState(false);
  const [auteurNaam, setAuteurNaam] = useState("StartSport Redactie");
  const [auteurRol, setAuteurRol] = useState("Redactie");
  const [auteurBio, setAuteurBio] = useState("Onze redactie test en vergelijkt sportmateriaal om jou te helpen de juiste keuze te maken.");
  const [faqItems, setFaqItems] = useState<{ vraag: string; antwoord: string }[]>([]);
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    async function laad() {
      const { data } = await supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde");
      setSporten((data ?? []).map((s) => ({ label: s.naam, waarde: s.id })));
    }
    laad();
  }, []);

  function handleTitel(v: string) {
    setTitel(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
  }

  async function handleOpslaan() {
    if (!titel || !slug || !samenvatting || !inhoud) {
      setFout("Titel, slug, samenvatting en inhoud zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("articles").insert({
      titel, slug, samenvatting, inhoud,
      sport_id: sportId || null,
      gepubliceerd,
      auteur_naam: auteurNaam || "StartSport Redactie",
      auteur_rol: auteurRol || "Redactie",
      auteur_bio: auteurBio || null,
      faq: faqItems.filter((f) => f.vraag.trim() && f.antwoord.trim()),
      laatst_bijgewerkt: new Date().toISOString().slice(0, 10),
    });

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/artikelen");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Artikel schrijven</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Titel" naam="titel" verplicht waarde={titel} onChange={(v) => handleTitel(v as string)} placeholder="Beste padelracket voor beginners" />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} hulptekst="Wordt: startsport.nl/advies/deze-slug" />
        <FormVeld label="Gerelateerde sport (optioneel)" naam="sport" type="select" waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld
          label="Samenvatting"
          naam="samenvatting"
          type="textarea"
          verplicht
          waarde={samenvatting}
          onChange={(v) => setSamenvatting(v as string)}
          placeholder="Korte intro van 1-2 zinnen — verschijnt in het overzicht en als meta-omschrijving"
        />
        <div>
          <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">
            Inhoud <span className="text-brand-gold">*</span>
          </label>
          <textarea
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            rows={16}
            placeholder={"Schrijf hier je artikel.\n\nGebruik een lege regel tussen alinea's — die worden automatisch omgezet naar aparte paragrafen op de pagina.\n\nDerde alinea, enzovoort."}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors resize-none leading-relaxed"
          />
          <p className="text-brand-muted text-xs font-mono mt-1">Platte tekst — lege regel = nieuwe alinea. Geen opmaak-codes nodig.</p>
        </div>

        {/* Auteur — E-E-A-T signaal, toont expertise/identiteit op de pagina */}
        <div className="space-y-4 border-t border-brand-border pt-6">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Auteur (E-E-A-T)</p>
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Naam" naam="auteurNaam" waarde={auteurNaam} onChange={(v) => setAuteurNaam(v as string)} />
            <FormVeld label="Rol" naam="auteurRol" waarde={auteurRol} onChange={(v) => setAuteurRol(v as string)} placeholder="bijv. Padel-specialist" />
          </div>
          <FormVeld label="Korte bio" naam="auteurBio" type="textarea" waarde={auteurBio} onChange={(v) => setAuteurBio(v as string)} hulptekst="Verschijnt onderaan het artikel — toont expertise en vertrouwen" />
        </div>

        {/* FAQ editor */}
        <div className="space-y-4 border-t border-brand-border pt-6">
          <div className="flex items-center justify-between">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Veelgestelde vragen (optioneel)</p>
            <button
              type="button"
              onClick={() => setFaqItems((prev) => [...prev, { vraag: "", antwoord: "" }])}
              className="text-xs font-mono text-brand-gold hover:text-brand-gold-light transition-colors"
            >
              ＋ Vraag toevoegen
            </button>
          </div>
          {faqItems.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted text-xs font-mono">Vraag {i + 1}</span>
                <button
                  type="button"
                  onClick={() => setFaqItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 text-xs font-mono hover:text-red-300"
                >
                  Verwijderen
                </button>
              </div>
              <input
                type="text"
                value={item.vraag}
                onChange={(e) => setFaqItems((prev) => prev.map((f, idx) => idx === i ? { ...f, vraag: e.target.value } : f))}
                placeholder="Vraag"
                className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold"
              />
              <textarea
                value={item.antwoord}
                onChange={(e) => setFaqItems((prev) => prev.map((f, idx) => idx === i ? { ...f, antwoord: e.target.value } : f))}
                placeholder="Antwoord"
                rows={2}
                className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>
          ))}
          {faqItems.length === 0 && (
            <p className="text-brand-muted text-xs font-mono">Geen vragen toegevoegd. FAQ's verbeteren SEO en tonen diepgang.</p>
          )}
        </div>

        <FormVeld
          label="Direct publiceren"
          naam="gepubliceerd"
          type="checkbox"
          waarde={gepubliceerd}
          onChange={(v) => setGepubliceerd(v as boolean)}
        />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : gepubliceerd ? "Publiceren" : "Opslaan als concept"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>
      </div>
    </div>
  );
}
