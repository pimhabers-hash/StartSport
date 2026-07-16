/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage — pas dit aan zodra je je eigen project-URL hebt
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
