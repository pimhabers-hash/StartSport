import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { TradeTrackerTag } from "@/components/analytics/TradeTrackerTag";

export const metadata: Metadata = {
  metadataBase: new URL("https://startsport.nl"),
  title: "StartSport — Vind jouw perfecte sportuitrusting",
  description:
    "StartSport helpt je in enkele stappen naar een compleet, persoonlijk samengesteld sportpakket.",
  openGraph: {
    title: "StartSport — Vind jouw perfecte sportuitrusting",
    description: "Beantwoord een paar vragen en ontvang een persoonlijk sportpakket.",
    url: "https://startsport.nl",
    siteName: "StartSport",
    locale: "nl_NL",
    type: "website",
    images: ["/opengraph-image"],
  },
  other: {
    "tradetracker-site-verification": "0143437e96ae183e8402ac0f20e307cd27e79169",
  },
};

// Organization structured data: dit (niet de favicon) is het mechanisme
// waarmee Google een merklogo aan een site koppelt in zoekresultaten —
// zie https://developers.google.com/search/docs/appearance/structured-data/logo.
// "logo" verwijst naar /apple-icon (180x180, ruim boven Google's minimum
// van 112x112px).
const ORGANISATIE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "StartSport",
  url: "https://startsport.nl",
  logo: "https://startsport.nl/apple-icon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-brand-black text-brand-ivory antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATIE_JSONLD) }}
        />
        {children}
        <CookieBanner />
        <GoogleAnalytics />
        <TradeTrackerTag />
      </body>
    </html>
  );
}
