import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Supabase client voor gebruik in Server Components, Server Actions
 * en Route Handlers. Leest/schrijft de sessie via cookies, zodat
 * ingelogde gebruikers (later: admins) server-side herkend worden.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Genegeerd: setAll wordt soms aangeroepen vanuit een Server
            // Component waar je geen cookies mag zetten. Middleware
            // (later toe te voegen) ververst de sessie in dat geval.
          }
        },
      },
    }
  );
}
