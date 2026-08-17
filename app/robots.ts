import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/promo"],
    },
    sitemap: "https://www.startsport.nl/sitemap.xml",
  };
}
