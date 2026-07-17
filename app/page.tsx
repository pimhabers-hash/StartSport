import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { SportenGrid } from "@/components/home/SportenGrid";
import { HoeHetWerkt } from "@/components/home/HoeHetWerkt";
import { Footer } from "@/components/home/Footer";

export default async function HomePage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sports")
    .select("*", { count: "exact", head: true })
    .eq("actief", true);

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <main className="pt-16">
        <Hero aantalSporten={count ?? 0} />
        <HoeHetWerkt />
        <SportenGrid />
      </main>
      <Footer />
    </div>
  );
}
