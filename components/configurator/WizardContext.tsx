"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ErvaringNiveau,
  BudgetKlasse,
  GebruikFrequentie,
  BinnenBuiten,
} from "@/lib/supabase/database.types";

export interface WizardSport {
  id: string;
  naam: string;
  slug: string;
}

export type LeeftijdCategorie = "junior" | "volwassene" | "senior";
export type Geslacht = "man" | "vrouw" | "anders";
export type Doel = "gezond_blijven" | "afvallen" | "competitie" | "sociaal" | "prestatie";

export interface WizardState {
  stap: number; // 1–6
  sport: WizardSport | null;
  niveau: ErvaringNiveau | null;
  budgetklasse: BudgetKlasse | null;
  frequentie: GebruikFrequentie | null;
  binnen_buiten: BinnenBuiten | null;
  doel: Doel | null;
  leeftijd: LeeftijdCategorie | null;
  geslacht: Geslacht | null;
}

interface WizardContextValue {
  state: WizardState;
  setSport: (sport: WizardSport) => void;
  setNiveau: (niveau: ErvaringNiveau) => void;
  setBudgetklasse: (budget: BudgetKlasse) => void;
  setFrequentie: (frequentie: GebruikFrequentie) => void;
  setBinnenBuiten: (bb: BinnenBuiten) => void;
  setDoel: (doel: Doel) => void;
  setLeeftijd: (l: LeeftijdCategorie) => void;
  setGeslacht: (g: Geslacht) => void;
  vorigeStap: () => void;
  volgendeStap: () => void;
  gaNaarStap: (stap: number) => void;
  isCompleet: boolean;
  aantalStappen: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  initieSport,
}: {
  children: ReactNode;
  initieSport?: WizardSport;
}) {
  const [state, setState] = useState<WizardState>({
    // Als sport meegegeven vanuit homepage → begin op stap 2
    stap: initieSport ? 2 : 1,
    sport: initieSport ?? null,
    niveau: null,
    budgetklasse: null,
    frequentie: null,
    binnen_buiten: null,
    doel: null,
    leeftijd: null,
    geslacht: null,
  });

  const setSport = useCallback((sport: WizardSport) => {
    setState((s) => ({ ...s, sport, stap: 2 }));
  }, []);

  const setNiveau = useCallback((niveau: ErvaringNiveau) => {
    setState((s) => ({ ...s, niveau, stap: s.stap < 3 ? 3 : s.stap }));
  }, []);

  const setBudgetklasse = useCallback((budgetklasse: BudgetKlasse) => {
    setState((s) => ({ ...s, budgetklasse, stap: s.stap < 4 ? 4 : s.stap }));
  }, []);

  const setFrequentie = useCallback((frequentie: GebruikFrequentie) => {
    setState((s) => ({ ...s, frequentie, stap: s.stap < 5 ? 5 : s.stap }));
  }, []);

  const setBinnenBuiten = useCallback((binnen_buiten: BinnenBuiten) => {
    setState((s) => ({ ...s, binnen_buiten, stap: s.stap < 6 ? 6 : s.stap }));
  }, []);

  const setDoel = useCallback((doel: Doel) => {
    setState((s) => ({ ...s, doel }));
  }, []);

  const setLeeftijd = useCallback((leeftijd: LeeftijdCategorie) => {
    setState((s) => ({ ...s, leeftijd }));
  }, []);

  const setGeslacht = useCallback((geslacht: Geslacht) => {
    setState((s) => ({ ...s, geslacht }));
  }, []);

  const vorigeStap = useCallback(() => {
    setState((s) => ({ ...s, stap: Math.max(initieSport ? 2 : 1, s.stap - 1) }));
  }, [initieSport]);

  const volgendeStap = useCallback(() => {
    setState((s) => ({ ...s, stap: Math.min(6, s.stap + 1) }));
  }, []);

  const gaNaarStap = useCallback((stap: number) => {
    setState((s) => ({ ...s, stap }));
  }, []);

  const isCompleet =
    state.sport !== null &&
    state.niveau !== null &&
    state.budgetklasse !== null &&
    state.frequentie !== null &&
    state.binnen_buiten !== null &&
    state.doel !== null;

  return (
    <WizardContext.Provider
      value={{
        state,
        setSport,
        setNiveau,
        setBudgetklasse,
        setFrequentie,
        setBinnenBuiten,
        setDoel,
        setLeeftijd,
        setGeslacht,
        vorigeStap,
        volgendeStap,
        gaNaarStap,
        isCompleet,
        aantalStappen: 6,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
