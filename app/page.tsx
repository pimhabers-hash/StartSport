import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { SportenGrid } from "@/components/home/SportenGrid";
import { HoeHetWerkt } from "@/components/home/HoeHetWerkt";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <HoeHetWerkt />
        <SportenGrid />
      </main>
      <Footer />
    </div>
  );
}
