"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormVeld } from "@/components/admin/FormVeld";

interface FaqItem { vraag: string; antwoord: string; }

export default function BewerkArtikelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const [titel, setTitel] = useState("");
  const [slug, setSlug] = useState("");
  const [samenvatting, setSamenvatting] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [sportId, setSportId] = useState("");
  const [gepubliceerd, setGepubliceerd] = useState(false);
  const [sporten, setSporten] = useState<{ label: string; waarde: string }[]>([]);

  const [auteurNaam, setAuteurNaam] = useState("StartSport Redactie");
  const [auteurRol, setAuteurRol] = useState("Redactie");
  const [auteurBio, setAuteurBio] = useState("");
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    async function laadData() {
      const [{ data: artikel }, { data: s }] = await Promise.all([
        supabase.from("articles").select("*").eq("id", id).single(),
        supabase.from("sports").select("id, naam").eq("actief", true).order("volgorde"),
      ]);
      if (artikel) {
        setTitel(artikel.titel);
        setSlug(artikel.slug);
        setSamenvatting(artikel.samenvatting);
        setInhoud(artikel.inhoud);
        setSportId(artikel.sport_id ?? "");
        setGepubliceerd(artikel.gepubliceerd);
        setAuteurNaam(artikel.auteur_naam ?? "StartSport Redactie");
        setAuteurRol(artikel.auteur_rol ?? "Redactie");
        setAuteurBio(artikel.auteur_bio ?? "");
        setFaqItems(Array.isArray(artikel.faq) ? artikel.faq : []);
      }
      setSporten((s ?? []).map((x) => ({ label: x.naam, waarde: x.id })));
      setLaden(false);
    }
    laadData();
  }, [id]);

  async function handleOpslaan() {
    if (!titel || !slug || !samenvatting || !inhoud) {
      setFout("Titel, slug, samenvatting en inhoud zijn verplicht.");
      return;
    }
    setOpslaan(true); setFout(null);

    const { error } = await supabase.from("articles").update({
      titel, slug, samenvatting, inhoud,
      sport_id: sportId || null,
      gepubliceerd,
      auteur_naam: auteurNaam || "StartSport Redactie",
      auteur_rol: auteurRol || "Redactie",
      auteur_bio: auteurBio || null,
      faq: faqItems.filter((f) => f.vraag.trim() && f.antwoord.trim()),
      laatst_bijgewerkt: new Date().toISOString().slice(0, 10),
    }).eq("id", id);

    if (error) { setFout(error.message); setOpslaan(false); return; }
    router.push("/admin/artikelen");
  }

  async function handleVerwijderen() {
    if (!confirm("Weet je zeker dat je dit artikel wilt verwijderen?")) return;
    setVerwijderen(true);
    await supabase.from("articles").delete().eq("id", id);
    router.push("/admin/artikelen");
  }

  if (laden) return <div className="text-brand-muted font-mono text-sm animate-pulse">Laden...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-brand-muted hover:text-brand-ivory text-sm font-mono">← Terug</button>
        <h1 className="font-display text-3xl text-brand-ivory">Artikel bewerken</h1>
      </div>

      <div className="card-surface rounded-2xl p-8 space-y-5">
        <FormVeld label="Titel" naam="titel" verplicht waarde={titel} onChange={(v) => setTitel(v as string)} />
        <FormVeld label="Slug (URL)" naam="slug" verplicht waarde={slug} onChange={(v) => setSlug(v as string)} />
        <FormVeld label="Gerelateerde sport" naam="sport" type="select" waarde={sportId} onChange={(v) => setSportId(v as string)} opties={sporten} />
        <FormVeld label="Samenvatting" naam="samenvatting" type="textarea" verplicht waarde={samenvatting} onChange={(v) => setSamenvatting(v as string)} />
        <div>
          <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Inhoud <span className="text-brand-gold">*</span></label>
          <textarea
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            rows={16}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Auteur — E-E-A-T */}
        <div className="space-y-4 border-t border-brand-border pt-6">
          <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Auteur (E-E-A-T)</p>
          <div className="grid grid-cols-2 gap-4">
            <FormVeld label="Naam" naam="auteurNaam" waarde={auteurNaam} onChange={(v) => setAuteurNaam(v as string)} />
            <FormVeld label="Rol" naam="auteurRol" waarde={auteurRol} onChange={(v) => setAuteurRol(v as string)} placeholder="bijv. Padel-specialist" />
          </div>
          <FormVeld label="Korte bio" naam="auteurBio" type="textarea" waarde={auteurBio} onChange={(v) => setAuteurBio(v as string)} hulptekst="Verschijnt onderaan het artikel" />
        </div>

        {/* FAQ editor */}
        <div className="space-y-4 border-t border-brand-border pt-6">
          <div className="flex items-center justify-between">
            <p className="text-brand-gold text-xs font-mono uppercase tracking-widest">Veelgestelde vragen</p>
            <button type="button" onClick={() => setFaqItems((prev) => [...prev, { vraag: "", antwoord: "" }])}
              className="text-xs font-mono text-brand-gold hover:text-brand-gold-light transition-colors">
              ＋ Vraag toevoegen
            </button>
          </div>
          {faqItems.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted text-xs font-mono">Vraag {i + 1}</span>
                <button type="button" onClick={() => setFaqItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 text-xs font-mono hover:text-red-300">
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
            <p className="text-brand-muted text-xs font-mono">Geen vragen toegevoegd.</p>
          )}
        </div>

        <FormVeld label="Gepubliceerd" naam="gepubliceerd" type="checkbox" waarde={gepubliceerd} onChange={(v) => setGepubliceerd(v as boolean)} />

        {fout && <p className="text-red-400 text-sm font-mono">{fout}</p>}

        <div className="flex gap-3">
          <button onClick={handleOpslaan} disabled={opslaan} className="flex-1 py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40">
            {opslaan ? "Opslaan..." : "Wijzigingen opslaan"}
          </button>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-brand-border text-brand-muted text-sm">Annuleren</button>
        </div>

        <div className="border-t border-brand-border pt-6">
          <p className="text-brand-muted text-xs font-mono uppercase tracking-widest mb-3">Gevaarzone</p>
          <button onClick={handleVerwijderen} disabled={verwijderen}
            className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/10 transition-colors disabled:opacity-40">
            {verwijderen ? "Verwijderen..." : "Artikel verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
