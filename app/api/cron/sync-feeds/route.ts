import { NextRequest, NextResponse } from "next/server";
import { syncAlleFeeds } from "@/lib/sync-feeds";

// Deze route wordt dagelijks aangeroepen door Vercel Cron (zie vercel.json).
// Beveiligd met een geheime header, zodat niemand anders 'm kan triggeren.

// 300s was de bekende, werkende waarde. Een hogere waarde (800s) leek
// in theorie geen kwaad te kunnen, maar Vercel valideert maxDuration bij
// het deployen tegen het actieve abonnement — een te hoge waarde kan de
// hele deployment laten falen in plaats van 'm gewoon af te toppen.
// Terug naar 300; de time-out per feed (zie lib/sync-feeds.ts) beperkt
// intussen zelf al hoe lang één trage feed kan meetellen.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resultaat = await syncAlleFeeds();
  return NextResponse.json({ ok: true, ...resultaat });
}
