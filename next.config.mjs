/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "media.s-bol.com",
      },
      {
        protocol: "https",
        hostname: "*.bol.com",
      },
      {
        protocol: "https",
        hostname: "assets.adidas.com",
      },
      {
        protocol: "https",
        hostname: "*.nike.com",
      },
      {
        protocol: "https",
        hostname: "static.decathlon.com",
      },
      {
        protocol: "https",
        hostname: "contents.mediadecathlon.com",
      },
    ],
  },
};

export default nextConfig;
