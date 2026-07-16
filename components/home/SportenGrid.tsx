import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SPORT_EMOJI: Record<string, string> = {
  padel: "🎾", tennis: "🎾", hardlopen: "👟",
  fitness: "🏋️", volleybal: "🏐", golf: "⛳",
  pickleball: "🏓", schermen: "🤺",
};

export async function SportenGrid() {
  const supabase = await createClient();
  const { data: sporten } = await supabase
    .from("sports")
    .select("id, naam, slug, beschrijving")
    .eq("actief", true)
    .order("volgorde");

  if (!sporten || sporten.length === 0) return null;

  return (
    <section id="sporten" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="mb-14">
        <p className="font-mono text-brand-gold text-xs uppercase tracking-[0.2em] mb-3">
          Beschikbare sporten
        </p>
        <h2 className="font-display text-4xl lg:text-5xl text-brand-ivory leading-tight">
          Kies jouw{" "}
          <em className="not-italic text-gold-gradient font-light">sport</em>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sporten.map((sport) => (
          <Link
            key={sport.id}
            href={`/configurator?sport=${sport.slug}`}
            className="group card-surface rounded-2xl p-6 flex flex-col gap-4 hover:border-brand-gold/40 hover:bg-brand-card/80 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-surface flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
              {SPORT_EMOJI[sport.slug] ?? "🏅"}
            </div>
            <div>
              <h3 className="font-display font-semibold text-brand-ivory text-lg leading-tight group-hover:text-gold-gradient transition-colors">
                {sport.naam}
              </h3>
              {sport.beschrijving && (
                <p className="text-brand-muted text-sm mt-1 leading-snug line-clamp-2">
                  {sport.beschrijving}
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center gap-1 text-brand-gold text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Start configurator
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
