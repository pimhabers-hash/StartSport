"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const OPSLAG_KEY = "startsport_cookie_consent";

interface OpgeslagenConsent {
  status: string;
  voorkeuren: { analytics: boolean; marketing: boolean };
}

export function TradeTrackerTag() {
  const [toegestaan, setToegestaan] = useState(false);

  useEffect(() => {
    function checkConsent() {
      const opgeslagen = localStorage.getItem(OPSLAG_KEY);
      if (!opgeslagen) return;
      try {
        const consent: OpgeslagenConsent = JSON.parse(opgeslagen);
        setToegestaan(consent.voorkeuren?.marketing === true);
      } catch {
        // ongeldige data, negeren
      }
    }

    checkConsent();
    window.addEventListener("storage", checkConsent);
    window.addEventListener("cookie-consent-updated", checkConsent);

    return () => {
      window.removeEventListener("storage", checkConsent);
      window.removeEventListener("cookie-consent-updated", checkConsent);
    };
  }, []);

  if (!toegestaan) return null;

  return (
    <Script id="tradetracker-supertag" strategy="afterInteractive">
      {`
        var _TradeTrackerTagOptions = {
          t: 'a',
          s: '513299',
          chk: '976380d38e1689026685aee2d9001276',
          overrideOptions: {}
        };
        (function() {
          var tt = document.createElement('script'), s = document.getElementsByTagName('script')[0];
          tt.setAttribute('type', 'text/javascript');
          tt.setAttribute('src', (document.location.protocol == 'https:' ? 'https' : 'http') + '://tm.tradetracker.net/tag?t=' + _TradeTrackerTagOptions.t + '&s=' + _TradeTrackerTagOptions.s + '&chk=' + _TradeTrackerTagOptions.chk);
          s.parentNode.insertBefore(tt, s);
        })();
      `}
    </Script>
  );
}
