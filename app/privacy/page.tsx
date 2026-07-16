import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = { title: "Privacyverklaring — StartSport" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">
            Juridisch
          </p>
          <h1 className="font-display text-4xl text-brand-ivory mb-2">Privacyverklaring</h1>
          <p className="text-brand-muted text-sm font-mono mb-12">Laatst bijgewerkt: juli 2026</p>

          <div className="prose-legal space-y-8 text-brand-muted font-body text-sm leading-relaxed">

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">1. Wie zijn wij</h2>
              <p>
                StartSport ("wij", "ons") is een online platform dat gebruikers helpt bij het
                samenstellen van sportuitrusting. Wij verkopen zelf geen producten, maar
                verwijzen door naar externe aanbieders via affiliate-links.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">2. Welke gegevens verzamelen we</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-brand-ivory">Configuratiegegevens:</strong> je antwoorden
                  in de sportconfigurator (sport, niveau, budget, voorkeuren) — dit is nodig om
                  je een pakket te kunnen tonen.
                </li>
                <li>
                  <strong className="text-brand-ivory">Klikgedrag:</strong> welke producten je
                  bekijkt en aanklikt, om onze aanbevelingen te verbeteren en affiliate-commissies
                  correct toe te wijzen.
                </li>
                <li>
                  <strong className="text-brand-ivory">Technische gegevens:</strong> een anonieme
                  sessie-ID via een cookie, IP-adres (verkort), browsertype.
                </li>
                <li>
                  <strong className="text-brand-ivory">Accountgegevens:</strong> indien je een
                  account aanmaakt, je e-mailadres. (Momenteel alleen voor beheerders.)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">3. Waarom we deze gegevens gebruiken</h2>
              <p>
                We gebruiken je gegevens uitsluitend om: (1) je een persoonlijk sportpakket te
                tonen, (2) de website technisch te laten functioneren, (3) te meten welke
                aanbevelingen goed werken zodat we het platform kunnen verbeteren, en (4) affiliate-
                commissies correct te registreren bij onze partners.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">4. Cookies</h2>
              <p>
                We gebruiken noodzakelijke cookies (voor het functioneren van de site) en, met jouw
                toestemming, analytics- en marketingcookies. Zie ons volledige{" "}
                <a href="/cookies" className="text-brand-gold underline hover:no-underline">cookiebeleid</a>{" "}
                voor details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">5. Delen met derden</h2>
              <p>
                We delen geen persoonsgegevens met derden, behalve: (a) affiliate-netwerken
                (zoals Awin, Daisycon, TradeTracker) om klikken en conversies toe te wijzen, en
                (b) hostingpartijen (Vercel, Supabase) die onze technische infrastructuur leveren.
                Deze partijen verwerken gegevens uitsluitend in onze opdracht.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">6. Bewaartermijn</h2>
              <p>
                Configuratie- en klikgegevens bewaren we maximaal 24 maanden, tenzij je eerder om
                verwijdering vraagt. Accountgegevens bewaren we zolang je account actief is.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">7. Jouw rechten</h2>
              <p>
                Onder de AVG heb je recht op inzage, correctie, verwijdering, en overdraagbaarheid
                van je gegevens, en het recht om bezwaar te maken tegen verwerking. Neem hiervoor
                contact met ons op via de{" "}
                <a href="/contact" className="text-brand-gold underline hover:no-underline">contactpagina</a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">8. Contact</h2>
              <p>
                Vragen over deze privacyverklaring? Neem contact op via onze{" "}
                <a href="/contact" className="text-brand-gold underline hover:no-underline">contactpagina</a>.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
