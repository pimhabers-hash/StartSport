"use client";

interface VeldProps {
  label: string;
  naam: string;
  type?: "text" | "number" | "url" | "textarea" | "select" | "checkbox";
  verplicht?: boolean;
  placeholder?: string;
  waarde: string | number | boolean;
  onChange: (waarde: string | boolean) => void;
  opties?: { label: string; waarde: string }[];
  hulptekst?: string;
}

export function FormVeld({
  label, naam, type = "text", verplicht,
  placeholder, waarde, onChange, opties, hulptekst,
}: VeldProps) {
  const basisKlasse =
    "w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors";

  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id={naam}
            checked={waarde as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            waarde ? "border-brand-gold bg-brand-gold" : "border-brand-border bg-brand-surface"
          }`}>
            {waarde && (
              <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                <path d="M2 5.5L4.5 8L8.5 3" stroke="#0A0B0D" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        </div>
        <span className="text-brand-ivory text-sm font-body">{label}</span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={naam} className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">
        {label} {verplicht && <span className="text-brand-gold">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={naam}
          value={waarde as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${basisKlasse} resize-none`}
        />
      ) : type === "select" ? (
        <select
          id={naam}
          value={waarde as string}
          onChange={(e) => onChange(e.target.value)}
          className={`${basisKlasse} appearance-none cursor-pointer`}
        >
          <option value="">— Kies een optie —</option>
          {opties?.map((o) => (
            <option key={o.waarde} value={o.waarde}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={naam}
          type={type}
          value={waarde as string | number}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={verplicht}
          step={type === "number" ? "0.01" : undefined}
          className={basisKlasse}
        />
      )}

      {hulptekst && (
        <p className="text-brand-muted text-xs font-mono mt-1">{hulptekst}</p>
      )}
    </div>
  );
}
