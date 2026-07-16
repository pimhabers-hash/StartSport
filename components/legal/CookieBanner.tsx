"use client";

import { useState, useEffect } from "react";

type ConsentStatus = "geaccepteerd" | "geweigerd" | "aangepast";

interface ConsentVoorkeuren {
  noodzakelijk: true; // altijd aan, niet uit te zetten
  analytics: boolean;
  marketing: boolean;
}

const OPSLAG_KEY = "startsport_cookie_consent";

export function CookieBanner() {
  const [zichtbaar, setZichtbaar] = useState(false);
  const [instellingenOpen, setInstellingenOpen] = useState(false);
  const [voorkeuren, setVoorkeuren] = useState<ConsentVoorkeuren>({
    noodzakelijk: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const opgeslagen = localStorage.getItem(OPSLAG_KEY);
    if (!opgeslagen) {
      setZichtbaar(true);
    }
  }, []);

  function sla_op(status: ConsentStatus, voork: ConsentVoorkeuren) {
    localStorage.setItem(
      OPSLAG_KEY,
      JSON.stringify({ status, voorkeuren: voork, datum: new Date().toISOString() })
    );
    setZichtbaar(false);

    // Hier zou je later analytics/marketing scripts conditioneel laden,
    // bijvoorbeeld: if (voork.analytics) { laad GA4 script }
  }

  function accepteerAlles() {
    const alles: ConsentVoorkeuren = { noodzakelijk: true, analytics: true, marketing: true };
    setVoorkeuren(alles);
    sla_op("geaccepteerd", alles);
  }

  function weigerAlles() {
    const minimaal: ConsentVoorkeuren = { noodzakelijk: true, analytics: false, marketing: false };
    setVoorkeuren(minimaal);
    sla_op("geweigerd", minimaal);
  }

  function bevestigAangepast() {
    sla_op("aangepast", voorkeuren);
  }

  if (!zichtbaar) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto card-surface rounded-2xl p-6 shadow-2xl shadow-black/60">
        {!instellingenOpen ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🍪</span>
              <div>
                <h3 className="font-display font-semibold text-brand-ivory text-base mb-1">
                  We gebruiken cookies
                </h3>
                <p className="text-brand-muted text-sm font-body leading-relaxed">
                  We gebruiken noodzakelijke cookies om de website te laten werken, en
                  optioneel analytics- en marketingcookies om je ervaring te verbeteren.
                  Lees meer in ons{" "}
                  <a href="/cookies" className="text-brand-gold underline hover:no-underline">
                    cookiebeleid
                  </a>.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={accepteerAlles}
                className="flex-1 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Alles accepteren
              </button>
              <button
                onClick={weigerAlles}
                className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm hover:text-brand-ivory transition-colors"
              >
                Alleen noodzakelijk
              </button>
              <button
                onClick={() => setInstellingenOpen(true)}
                className="px-4 py-2.5 text-brand-muted text-sm font-mono hover:text-brand-ivory transition-colors"
              >
                Instellingen
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-display font-semibold text-brand-ivory text-base mb-4">
              Cookie-instellingen
            </h3>
            <div className="space-y-4 mb-5">
              {/* Noodzakelijk */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-ivory text-sm font-body">Noodzakelijk</p>
                  <p className="text-brand-muted text-xs">Vereist voor het functioneren van de website</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-brand-gold/40 flex items-center px-1">
                  <div className="w-4 h-4 rounded-full bg-brand-gold ml-auto" />
                </div>
              </div>
              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-ivory text-sm font-body">Analytics</p>
                  <p className="text-brand-muted text-xs">Helpt ons de website te verbeteren</p>
                </div>
                <button
                  onClick={() => setVoorkeuren((v) => ({ ...v, analytics: !v.analytics }))}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    voorkeuren.analytics ? "bg-brand-gold" : "bg-brand-border"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-brand-black transition-transform ${
                    voorkeuren.analytics ? "translate-x-4" : ""
                  }`} />
                </button>
              </div>
              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-ivory text-sm font-body">Marketing & tracking</p>
                  <p className="text-brand-muted text-xs">Voor gepersonaliseerde affiliate-aanbevelingen</p>
                </div>
                <button
                  onClick={() => setVoorkeuren((v) => ({ ...v, marketing: !v.marketing }))}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    voorkeuren.marketing ? "bg-brand-gold" : "bg-brand-border"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-brand-black transition-transform ${
                    voorkeuren.marketing ? "translate-x-4" : ""
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={bevestigAangepast}
                className="flex-1 py-2.5 rounded-xl gold-shimmer text-brand-black text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Voorkeuren opslaan
              </button>
              <button
                onClick={() => setInstellingenOpen(false)}
                className="px-4 py-2.5 text-brand-muted text-sm hover:text-brand-ivory transition-colors"
              >
                Terug
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
