import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: "StartSport — Vind jouw perfecte sportuitrusting",
  description:
    "StartSport helpt je in enkele stappen naar een compleet, persoonlijk samengesteld sportpakket.", 
    other: {"9842094c5e98067": "9e46039e18af18b892e27c5590630fb5",}
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
