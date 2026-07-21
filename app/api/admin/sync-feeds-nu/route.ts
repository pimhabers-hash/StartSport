import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { syncAlleFeeds } from "@/lib/sync-feeds";

export const maxDuration = 300;

export async function POST() {
  // Check dat dit door een ingelogde admin wordt aangeroepen
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (!profile || profile.rol !== "admin") {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Direct de gedeelde synchronisatie-functie aanroepen — geen interne
  // HTTP-aanroep meer nodig (die faalde eerder omdat de basis-URL op
  // Vercel niet klopte).
  try {
    const resultaat = await syncAlleFeeds();
    return NextResponse.json({ ok: true, ...resultaat });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Onbekende fout" },
      { status: 500 }
    );
  }
}
