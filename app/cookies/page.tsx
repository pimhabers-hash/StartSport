import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export const metadata = { title: "Cookiebeleid — StartSport" };

const COOKIE_TABEL = [
  { naam: "ss_session", categorie: "Noodzakelijk", doel: "Onthoudt je sessie voor affiliate-klik toewijzing", bewaartermijn: "30 dagen" },
  { naam: "startsport_cookie_consent", categorie: "Noodzakelijk", doel: "Onthoudt je cookie-voorkeuren", bewaartermijn: "1 jaar" },
  { naam: "sb-access-token", categorie: "Noodzakelijk", doel: "Houdt admin-sessies actief (Supabase Auth)", bewaartermijn: "Sessie" },
  { naam: "_ga, _ga_XXXXXXX (indien geaccepteerd)", categorie: "Analytics", doel: "Google Analytics — meet bezoekersgedrag, geanonimiseerd IP", bewaartermijn: "2 jaar" },
  { naam: "TradeTracker (indien geaccepteerd)", categorie: "Marketing", doel: "Registreert of een aankoop via onze affiliate-link tot stand kwam, zodat de juiste commissie wordt toegewezen", bewaartermijn: "Tot 30 dagen" },
];

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Juridisch</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-2">Cookiebeleid</h1>
          <p className="text-brand-muted text-sm font-mono mb-12">Laatst bijgewerkt: juli 2026</p>

          <div className="space-y-8 text-brand-muted font-body text-sm leading-relaxed">
            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Wat zijn cookies</h2>
              <p>
                Cookies zijn kleine tekstbestanden die op je apparaat worden opgeslagen wanneer je
                onze website bezoekt. Ze helpen ons de site te laten functioneren en te begrijpen
                hoe bezoekers de site gebruiken.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Welke cookies gebruiken we</h2>
              <div className="card-surface rounded-xl overflow-hidden mt-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="text-left px-4 py-3 font-mono text-brand-gold">Naam</th>
                      <th className="text-left px-4 py-3 font-mono text-brand-gold">Categorie</th>
                      <th className="text-left px-4 py-3 font-mono text-brand-gold">Doel</th>
                      <th className="text-left px-4 py-3 font-mono text-brand-gold">Bewaartermijn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIE_TABEL.map((c) => (
                      <tr key={c.naam} className="border-b border-brand-border/50">
                        <td className="px-4 py-3 font-mono text-brand-ivory">{c.naam}</td>
                        <td className="px-4 py-3">{c.categorie}</td>
                        <td className="px-4 py-3">{c.doel}</td>
                        <td className="px-4 py-3">{c.bewaartermijn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Jouw keuze</h2>
              <p>
                Bij je eerste bezoek vragen we je toestemming voor niet-noodzakelijke cookies. Je
                kunt je voorkeuren altijd aanpassen door je browsergegevens voor deze site te
                wissen, waarna de banner opnieuw verschijnt.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-brand-ivory mb-3">Meer informatie</h2>
              <p>
                Zie ook onze{" "}
                <a href="/privacy" className="text-brand-gold underline hover:no-underline">privacyverklaring</a>{" "}
                voor meer informatie over hoe we met je gegevens omgaan.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
