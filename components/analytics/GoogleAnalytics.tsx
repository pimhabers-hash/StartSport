"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const OPSLAG_KEY = "startsport_cookie_consent";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

interface OpgeslagenConsent {
  status: string;
  voorkeuren: { analytics: boolean; marketing: boolean };
}

export function GoogleAnalytics() {
  const [toegestaan, setToegestaan] = useState(false);

  useEffect(() => {
    function checkConsent() {
      const opgeslagen = localStorage.getItem(OPSLAG_KEY);
      if (!opgeslagen) return;
      try {
        const consent: OpgeslagenConsent = JSON.parse(opgeslagen);
        setToegestaan(consent.voorkeuren?.analytics === true);
      } catch {
        // ongeldige data, negeren
      }
    }

    checkConsent();

    // Luister ook naar wijzigingen (bijv. als iemand later alsnog akkoord geeft)
    window.addEventListener("storage", checkConsent);
    // Custom event dat de CookieBanner kan triggeren na een keuze
    window.addEventListener("cookie-consent-updated", checkConsent);

    return () => {
      window.removeEventListener("storage", checkConsent);
      window.removeEventListener("cookie-consent-updated", checkConsent);
    };
  }, []);

  if (!toegestaan || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
