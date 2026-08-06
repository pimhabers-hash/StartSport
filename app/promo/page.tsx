import { createClient } from "@/lib/supabase/server";
import { PromoPlayer } from "@/components/promo/PromoPlayer";

export const metadata = { title: "StartSport — Promo" };

export default async function PromoPage() {
  const supabase = await createClient();

  const { data: sporten } = await supabase
    .from("sports")
    .select("id, naam, slug, icoon")
    .eq("actief", true)
    .order("volgorde")
    .limit(4);

  const eersteSport = sporten?.[0];

  const { data: producten } = eersteSport
    ? await supabase
        .from("products")
        .select("naam, merk, prijs, afbeelding_url, categories ( naam )")
        .eq("sport_id", eersteSport.id)
        .eq("actief", true)
        .order("score", { ascending: false })
        .limit(3)
    : { data: [] };

  return (
    <PromoPlayer
      sporten={(sporten ?? []).map((s) => ({ naam: s.naam, icoon: s.icoon }))}
      sportNaam={eersteSport?.naam ?? "Padel"}
      producten={(producten ?? []).map((p) => ({
        naam: p.naam,
        merk: p.merk,
        prijs: Number(p.prijs),
        afbeelding_url: p.afbeelding_url,
        categorie: Array.isArray(p.categories) ? p.categories[0]?.naam ?? "" : (p.categories as { naam: string } | null)?.naam ?? "",
      }))}
    />
  );
}
