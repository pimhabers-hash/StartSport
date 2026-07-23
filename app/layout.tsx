import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";



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
  },
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
        <Script id="tradetracker" strategy="afterInteractive">
  {`
    var _TradeTrackerTagOptions = {
      t: 'a',
      s: '513299',
      chk: '976380d38e1689026685aee2d9001276',
      overrideOptions: {}
    };

    (function() {
      var tt = document.createElement('script'),
          s = document.getElementsByTagName('script')[0];

      tt.setAttribute('type', 'text/javascript');
      tt.setAttribute(
        'src',
        (document.location.protocol === 'https:' ? 'https' : 'http') +
        '://tm.tradetracker.net/tag?t=' +
        _TradeTrackerTagOptions.t +
        '&s=' +
        _TradeTrackerTagOptions.s +
        '&chk=' +
        _TradeTrackerTagOptions.chk
      );

      s.parentNode.insertBefore(tt, s);
    })();
  `}
</Script>
      </body>
    </html>
  );
}
