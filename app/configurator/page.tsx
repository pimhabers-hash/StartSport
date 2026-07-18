import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Wizard } from "@/components/configurator/Wizard";

export const metadata = { title: "Configurator — StartSport" };

interface PageProps {
  searchParams: Promise<{ sport?: string }>;
}

export default async function ConfiguratorPage({ searchParams }: PageProps) {
  const { sport: sportSlug } = await searchParams;
  const supabase = await createClient();

  const { data: sporten } = await supabase
    .from("sports")
    .select("id, naam, slug, icoon")
    .eq("actief", true)
    .order("volgorde");

  // Als sport meegegeven via URL (?sport=padel), zoek het op
  const initieSport = sportSlug
    ? (sporten ?? []).find((s) => s.slug === sportSlug)
    : undefined;

  return (
    <>
      <Navbar />
      <Wizard
        sporten={sporten ?? []}
        initieSport={initieSport}
      />
    </>
  );
}
