/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Affiliate-feeds (Awin, Daisycon, en toekomstige partners) leveren
        // productafbeeldingen vanaf tientallen verschillende merchant-domeinen
        // (bijv. cdn.shopify.com, media.s-bol.com, brand-eigen CDN's). Een
        // domein-voor-domein whitelist is bij affiliate-marketing niet vol
        // te houden — elke nieuwe partner heeft weer een ander CDN-domein.
        // Omdat deze URL's altijd van vertrouwde affiliate-netwerken komen
        // (nooit door bezoekers zelf ingevoerd), staan we hier bewust alle
        // https-bronnen toe in plaats van een domeinlijst bij te houden.
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
