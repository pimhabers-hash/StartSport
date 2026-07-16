import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, configurator_result_id, provider_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: "product_id vereist" }, { status: 400 });
    }

    const supabase = await createClient();

    // Haal session_id op uit cookie (of maak anonieme ID aan)
    const session_id =
      request.cookies.get("ss_session")?.value ??
      crypto.randomUUID();

    await supabase.from("affiliate_clicks").insert({
      product_id,
      configurator_result_id: configurator_result_id ?? null,
      provider_id: provider_id ?? null,
      session_id,
    });

    const response = NextResponse.json({ ok: true });

    // Zet session-cookie als die nog niet bestaat (30 dagen)
    if (!request.cookies.get("ss_session")) {
      response.cookies.set("ss_session", session_id, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    // Tracking mag nooit een gebruikersflow breken
    console.error("Affiliate click tracking fout:", error);
    return NextResponse.json({ ok: true });
  }
}
