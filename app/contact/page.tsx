"use client";

import { useState } from "react";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export default function ContactPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [verzonden, setVerzonden] = useState(false);

  function handleVerzenden(e: React.FormEvent) {
    e.preventDefault();
    // TODO: koppel aan een echte verzendservice (bijv. Resend) in een latere fase.
    // Voor nu tonen we een bevestiging zonder daadwerkelijke verzending.
    setVerzonden(true);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          <p className="font-mono text-brand-gold text-xs uppercase tracking-widest mb-3">Contact</p>
          <h1 className="font-display text-4xl text-brand-ivory mb-4">Neem contact op</h1>
          <p className="text-brand-muted font-body text-sm mb-10">
            Vraag, opmerking, of wil je als aanbieder samenwerken? Laat het ons weten.
          </p>

          {verzonden ? (
            <div className="card-surface rounded-2xl p-8 text-center">
              <p className="text-3xl mb-3">✓</p>
              <p className="text-brand-ivory font-display text-lg mb-1">Bericht verzonden</p>
              <p className="text-brand-muted text-sm">We nemen zo snel mogelijk contact met je op.</p>
            </div>
          ) : (
            <form onSubmit={handleVerzenden} className="card-surface rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Naam</label>
                <input
                  type="text" required value={naam} onChange={(e) => setNaam(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">E-mail</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-mono uppercase tracking-widest mb-2">Bericht</label>
                <textarea
                  required rows={5} value={bericht} onChange={(e) => setBericht(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl gold-shimmer text-brand-black font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Versturen
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
