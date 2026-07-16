import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = { title: "Affiliate disclaimer — StartSport" };

export default function AffiliateDisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Juridisch</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-2">Affiliate disclaimer</h1>
          <p className="text-brand-muted text-sm font-mono mb-12">Laatst bijgewerkt: juli 2026</p>

          <div className="space-y-8 text-brand-muted font-body text-sm leading-relaxed">
            <section className="card-surface rounded-2xl p-6">
              <p className="text-brand-ivory font-body">
                Deze website bevat affiliate-links. Wanneer je via een link op StartSport een
                aankoop doet bij een van onze partnerwinkels, kunnen wij een commissie ontvangen.
                Dit brengt voor jou geen extra kosten met zich mee.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Hoe werkt dit</h2>
              <p>
                StartSport verkoopt zelf geen producten. We stellen op basis van jouw voorkeuren
                een persoonlijk sportpakket samen en verwijzen je door naar externe aanbieders
                zoals Decathlon, Bol, Nike, Adidas en gespecialiseerde sportwinkels. Als je via
                onze links een aankoop doet, ontvangen wij een commissie van de betreffende
                winkel — dit is hoe we het platform gratis kunnen aanbieden.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Onze onafhankelijkheid</h2>
              <p>
                Commissie heeft geen invloed op welke producten we aanbevelen. Onze aanbevelingen
                zijn gebaseerd op je ingevulde voorkeuren (niveau, budget, gebruik) — niet op welke
                aanbieder de hoogste commissie betaalt.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Prijzen</h2>
              <p>
                De getoonde prijzen zijn indicaties op basis van de laatst bekende informatie.
                De actuele prijs zie je altijd op de website van de aanbieder zelf.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
