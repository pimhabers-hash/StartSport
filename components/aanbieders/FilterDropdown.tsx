import Link from "next/link";

interface FilterOptie {
  label: string;
  href: string;
  actief: boolean;
  aantal?: number;
}

interface FilterDropdownProps {
  label: string;
  huidigeLabel: string;
  opties: FilterOptie[];
}

/**
 * Uitklapbaar filtermenu op basis van het native <details>-element —
 * geen client-side state/JS nodig (deze pagina blijft daardoor een
 * server component), en sluit vanzelf bij navigatie omdat de pagina dan
 * opnieuw rendert. Vervangt een lange, op mobiel horizontaal scrollende
 * rij pilletjes (onhandig bij aanbieders met 20+ sporten) door één
 * compacte knop die op klik opent.
 */
export function FilterDropdown({ label, huidigeLabel, opties }: FilterDropdownProps) {
  return (
    <details className="group relative">
      <summary
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border border-brand-border text-brand-muted cursor-pointer select-none list-none hover:border-brand-gold/40 transition-colors [&::-webkit-details-marker]:hidden group-open:border-brand-gold group-open:text-brand-gold"
      >
        <span className="text-brand-muted uppercase tracking-widest group-open:text-brand-gold">{label}:</span>
        <span className="text-brand-ivory group-open:text-brand-gold">{huidigeLabel}</span>
        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0 transition-transform group-open:rotate-180">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="absolute z-20 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-brand-border bg-brand-card shadow-xl shadow-black/40 p-1.5 space-y-0.5">
        {opties.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
              o.actief ? "bg-brand-gold/10 text-brand-gold" : "text-brand-muted hover:bg-brand-surface hover:text-brand-ivory"
            }`}
          >
            <span className="truncate">{o.label}</span>
            {o.aantal !== undefined && <span className="opacity-60 flex-shrink-0">({o.aantal})</span>}
          </Link>
        ))}
      </div>
    </details>
  );
}
