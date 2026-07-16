import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase client voor gebruik in Client Components ("use client").
 * Gebruikt de publieke anon key — veilig om in de browser te draaien
 * omdat Row Level Security (RLS) de daadwerkelijke toegang afdwingt.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
