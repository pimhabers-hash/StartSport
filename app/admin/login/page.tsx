"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [laden, setLaden] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setLaden(true);
    setFout(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: wachtwoord,
    });

    if (error) {
      setFout("Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.");
      setLaden(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-display text-2xl text-brand-ivory font-semibold">
            Start<em className="not-italic text-gold-gradient">Sport</em>
          </span>
          <p className="text-brand-muted text-sm font-mono mt-2">Admin</p>
        </div>

        {/* Formulier */}
        <div className="card-surface rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors"
              placeholder="admin@startsport.nl"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">
              Wachtwoord
            </label>
            <input
              type="password"
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm font-body focus:outline-none focus:border-brand-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          {fout && (
            <p className="text-red-400 text-xs font-mono">{fout}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={laden || !email || !wachtwoord}
            className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {laden ? "Inloggen..." : "Inloggen"}
          </button>
        </div>
      </div>
    </div>
  );
}
