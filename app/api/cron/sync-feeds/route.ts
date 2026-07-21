import { NextRequest, NextResponse } from "next/server";
import { syncAlleFeeds } from "@/lib/sync-feeds";

// Deze route wordt dagelijks aangeroepen door Vercel Cron (zie vercel.json).
// Beveiligd met een geheime header, zodat niemand anders 'm kan triggeren.

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
