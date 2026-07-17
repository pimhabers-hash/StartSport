import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: sporten } = await supabase
    .from("sports")
    .select("slug")
    .eq("actief", true);

  const basisPaginas: MetadataRoute.Sitemap = [
    { url: "https://startsport.nl", changeFrequency: "weekly", priority: 1 },
    { url: "https://startsport.nl/configurator", changeFrequency: "weekly", priority: 0.9 },
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

  return [...basisPaginas, ...sportPaginas];
}
