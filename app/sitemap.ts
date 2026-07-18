import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: sporten }, { data: artikelen }] = await Promise.all([
    supabase.from("sports").select("slug").eq("actief", true),
    supabase.from("articles").select("slug").eq("gepubliceerd", true),
  ]);

  const basisPaginas: MetadataRoute.Sitemap = [
    { url: "https://startsport.nl", changeFrequency: "weekly", priority: 1 },
    { url: "https://startsport.nl/configurator", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://startsport.nl/advies", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://startsport.nl/over-ons", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://startsport.nl/privacy", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://startsport.nl/cookies", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://startsport.nl/affiliate-disclaimer", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://startsport.nl/contact", changeFrequency: "yearly", priority: 0.3 },
  ];

  const sportPaginas: MetadataRoute.Sitemap = (sporten ?? []).map((s) => ({
    url: `https://startsport.nl/configurator?sport=${s.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const artikelPaginas: MetadataRoute.Sitemap = (artikelen ?? []).map((a) => ({
    url: `https://startsport.nl/advies/${a.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...basisPaginas, ...sportPaginas, ...artikelPaginas];
}
