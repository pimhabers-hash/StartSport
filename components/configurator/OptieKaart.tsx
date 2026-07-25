"use client";

interface OptieKaartProps {
  label: string;
  omschrijving?: string;
  icoon?: string;
  geselecteerd: boolean;
  onClick: () => void;
}

export function OptieKaart({
  label,
  omschrijving,
  icoon,
  geselecteerd,
  onClick,
}: OptieKaartProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-5 border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
        geselecteerd
          ? "border-brand-gold bg-brand-gold/5 shadow-lg shadow-brand-gold/10"
          : "border-brand-border bg-brand-card hover:border-brand-gold/40 hover:bg-brand-surface"
      }`}
    >
      <div className="flex items-start gap-4">
        {icoon && (
          <span className="text-2xl leading-none mt-0.5">{icoon}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-display font-semibold text-base transition-colors ${
                geselecteerd ? "text-brand-gold" : "text-brand-ivory"
              }`}
            >
              {label}
            </span>
            {/* Selectie-indicator */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                geselecteerd
                  ? "border-brand-gold bg-brand-gold"
                  : "border-brand-border"
              }`}
            >
              {geselecteerd && (
                <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                  <path
                    d="M2 5.5L4.5 8L8.5 3"
                    stroke="#0A0B0D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          {omschrijving && (
            <p className="text-brand-muted text-sm mt-1 leading-snug">
              {omschrijving}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
