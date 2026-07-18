import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = { title: "Over ons — StartSport" };

export default function OverOnsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Over ons</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-8">
            Waarom we <em className="not-italic text-gold-gradient font-light">StartSport</em> zijn begonnen
          </h1>

          <div className="space-y-6 text-brand-muted font-body text-sm leading-relaxed">
            <p className="text-brand-ivory text-base font-body leading-relaxed">
              Beginnen met een nieuwe sport is spannend genoeg — het zou niet nóg ingewikkelder
              moeten worden door honderden productopties op een grote webshop.
            </p>

            <p>
              StartSport is ontstaan uit een simpele frustratie: je besluit padel, tennis of
              hardlopen te gaan proberen, en voordat je één bal hebt geraakt, ben je al een uur
              verdwaald tussen rackets, schoenen en accessoires zonder te weten wat je nou écht
              nodig hebt.
            </p>

            <p>
              Wij bouwen geen webshop. We verkopen zelf niets. In plaats daarvan stellen we je een
              paar gerichte vragen — over je niveau, budget en hoe vaak je gaat sporten — en op
              basis daarvan stellen we een compleet, persoonlijk pakket samen. Elk product komt
              met een duidelijke uitleg waarom het bij jou past.
            </p>

            <p>
              Als je via onze aanbevelingen een aankoop doet bij een van onze partnerwinkels,
              ontvangen wij een kleine commissie. Dat kost jou niets extra, en het is hoe we het
              platform gratis kunnen aanbieden. Onze aanbevelingen zijn nooit gebaseerd op welke
              partner het meeste betaalt — lees daar meer over in onze{" "}
              <a href="/affiliate-disclaimer" className="text-brand-gold underline hover:no-underline">
                affiliate disclaimer
              </a>.
            </p>

            <h2 className="font-display text-xl text-brand-ivory pt-4">Waar we voor staan</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Eerlijk advies, niet gestuurd door commissiehoogte</li>
              <li>Duidelijke uitleg bij elk product — geen kale productlijst</li>
              <li>Geen account nodig om te beginnen</li>
              <li>Transparant over hoe we ons platform financieren</li>
            </ul>

            <h2 className="font-display text-xl text-brand-ivory pt-4">In ontwikkeling</h2>
            <p>
              StartSport is een groeiend platform. We breiden continu het aantal sporten,
              producten en koopgidsen uit. Heb je suggesties, feedback, of wil je als winkel
              samenwerken? Neem gerust{" "}
              <a href="/contact" className="text-brand-gold underline hover:no-underline">contact</a>{" "}
              met ons op.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
