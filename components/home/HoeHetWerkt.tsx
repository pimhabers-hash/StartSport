const STAPPEN = [
  {
    nr: "01",
    titel: "Kies je sport",
    omschrijving:
      "Selecteer de sport waarmee je wilt beginnen. Van padel tot schermen — we dekken het allemaal.",
  },
  {
    nr: "02",
    titel: "Vertel ons over jezelf",
    omschrijving:
      "Niveau, budget, hoe vaak je speelt. Drie vragen, geen formulieren, geen account nodig.",
  },
  {
    nr: "03",
    titel: "Ontvang jouw pakket",
    omschrijving:
      "Een persoonlijk samengesteld pakket met producten bij de beste aanbieders. Klik door en bestel direct.",
  },
];

export function HoeHetWerkt() {
  return (
    <section className="py-24 px-6 lg:px-12 border-t border-brand-border">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-[0.2em] mb-3">
            Hoe het werkt
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-brand-ivory leading-tight">
            Van nul naar{" "}
            <em className="not-italic text-gold-gradient font-light">klaar</em>{" "}
            in drie stappen
          </h2>
        </div>

        {/* Stappen */}
        <div className="grid md:grid-cols-3 gap-px bg-brand-border rounded-2xl overflow-hidden">
          {STAPPEN.map((stap) => (
            <div
              key={stap.nr}
              className="bg-brand-black p-8 lg:p-10 flex flex-col gap-6"
            >
              {/* Nummer */}
              <span className="font-mono text-brand-gold text-4xl font-medium leading-none">
                {stap.nr}
              </span>

              {/* Streep */}
              <div className="w-8 h-px bg-brand-gold/40" />

              {/* Inhoud */}
              <div>
                <h3 className="font-display text-xl text-brand-ivory font-semibold mb-2">
                  {stap.titel}
                </h3>
                <p className="text-brand-muted font-body text-sm leading-relaxed">
                  {stap.omschrijving}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
