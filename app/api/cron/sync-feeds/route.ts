import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseFeedBuffer, bepaalBudgetklasse, matchCategorie } from "@/lib/feed-import";

// Deze route wordt dagelijks aangeroepen door Vercel Cron (zie vercel.json).
// Beveiligd met een geheime header, zodat niemand anders 'm kan triggeren.

export const maxDuration = 300; // 5 minuten — grote feeds kunnen even duren
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role client — nodig omdat dit server-side draait zonder
  // ingelogde admin-sessie, en RLS anders de writes zou blokkeren.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: abonnementen } = await supabase
    .from("feed_subscriptions")
    .select("*")
    .eq("actief", true);

  const { data: categorieen } = await supabase.from("categories").select("id, naam, slug");
  const resultaten: Record<string, string> = {};

  for (const abo of abonnementen ?? []) {
    try {
      const response = await fetch(abo.feed_url);
      if (!response.ok) {
        resultaten[abo.naam] = `Feed niet bereikbaar (${response.status})`;
        continue;
      }

      const buffer = await response.arrayBuffer();
      const bestandsnaamHint = abo.feed_url.toLowerCase().includes(".xlsx") ? "feed.xlsx" : "feed.csv";
      const { rijen: ruweRijen } = parseFeedBuffer(buffer, bestandsnaamHint);

      const { data: bestaandeProducten } = await supabase
        .from("products")
        .select("id, naam, ean");
      const naamMap = new Map((bestaandeProducten ?? []).map((p) => [p.naam.toLowerCase().trim(), p.id]));
      const eanMap = new Map((bestaandeProducten ?? []).filter((p) => p.ean).map((p) => [p.ean, p.id]));

      let succes = 0, mislukt = 0, overgeslagen = 0;

      for (const rij of ruweRijen) {
        if (!rij.naam || !rij.prijs || !rij.affiliate_url) { mislukt++; continue; }
        const prijsGetal = parseFloat(rij.prijs.replace(",", "."));
        if (isNaN(prijsGetal)) { mislukt++; continue; }

        const category_id = rij.categorie_ruw
          ? matchCategorie(rij.categorie_ruw, categorieen ?? [])
          : null;
        if (rij.categorie_ruw && !category_id) { overgeslagen++; continue; }

        const bestaand_id = (rij.ean && eanMap.get(rij.ean)) ?? naamMap.get(rij.naam.toLowerCase().trim());
        const budgetklasse = bepaalBudgetklasse(prijsGetal, Number(abo.grens_budget), Number(abo.grens_midden));

        if (bestaand_id) {
          const { error } = await supabase.from("products").update({
            prijs: prijsGetal,
            affiliate_url: rij.affiliate_url,
            afbeelding_url: rij.afbeelding_url || null,
          }).eq("id", bestaand_id);
          if (error) mislukt++; else succes++;
        } else {
          const { error } = await supabase.from("products").insert({
            naam: rij.naam,
            merk: rij.merk || null,
            sport_id: abo.sport_id,
            category_id: category_id ?? (categorieen ?? [])[0]?.id,
            provider_id: abo.provider_id,
            prijs: prijsGetal,
            budgetklasse,
            affiliate_url: rij.affiliate_url,
            afbeelding_url: rij.afbeelding_url || null,
            ean: rij.ean || null,
            niveau: [],
            geschikt_voor_frequentie: [],
            score: 4.0,
            bron: "feed_sync",
            geclassificeerd: false,
            actief: false,
          });
          if (error) mislukt++; else succes++;
        }
      }

      const samenvatting = `${succes} verwerkt, ${overgeslagen} overgeslagen, ${mislukt} mislukt (${ruweRijen.length} totaal)`;
      resultaten[abo.naam] = samenvatting;

      await supabase.from("feed_subscriptions").update({
        laatste_sync: new Date().toISOString(),
        laatste_resultaat: samenvatting,
      }).eq("id", abo.id);
    } catch (err) {
      resultaten[abo.naam] = `Fout: ${err instanceof Error ? err.message : "onbekend"}`;
    }
  }

  return NextResponse.json({ ok: true, resultaten });
}
