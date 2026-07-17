import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client voor gebruik in Client Components ("use client").
 * Tijdelijk zonder strikte database-types om de deployment niet te
 * blokkeren — functioneel identiek, alleen minder autocomplete.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}