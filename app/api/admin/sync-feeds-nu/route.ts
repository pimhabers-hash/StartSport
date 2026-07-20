import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST() {
  // Check dat dit door een ingelogde admin wordt aangeroepen
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (!profile || profile.rol !== "admin") {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Roep de eigenlijke sync-logica aan via de cron-route, met het geheime token
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/cron/sync-feeds`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
