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
} from "@/lib/supabase/database.types";

export interface WizardSport {
  id: string;
  naam: string;
  slug: string;
  icoon?: string;
}

export type Geslacht = "man" | "vrouw" | "anders";
export type Doel = "gezond_blijven" | "afvallen" | "competitie" | "sociaal" | "prestatie";

export interface WizardState {
  stap: number; // 1–6
  sport: WizardSport | null;
  geslacht: Geslacht | null;
  niveau: ErvaringNiveau | null;
  budgetklasse: BudgetKlasse | null;
  frequentie: GebruikFrequentie | null;
  doel: Doel | null;
}

interface WizardContextValue {
  state: WizardState;
  setSport: (sport: WizardSport) => void;
  setGeslacht: (g: Geslacht) => void;
  setNiveau: (niveau: ErvaringNiveau) => void;
  setBudgetklasse: (budget: BudgetKlasse) => void;
  setFrequentie: (frequentie: GebruikFrequentie) => void;
  setDoel: (doel: Doel) => void;
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
    geslacht: null,
    niveau: null,
    budgetklasse: null,
    frequentie: null,
    doel: null,
  });

  const setSport = useCallback((sport: WizardSport) => {
    setState((s) => ({ ...s, sport, stap: 2 }));
  }, []);

  const setGeslacht = useCallback((geslacht: Geslacht) => {
    setState((s) => ({ ...s, geslacht, stap: s.stap < 3 ? 3 : s.stap }));
  }, []);

  const setNiveau = useCallback((niveau: ErvaringNiveau) => {
    setState((s) => ({ ...s, niveau, stap: s.stap < 4 ? 4 : s.stap }));
  }, []);

  const setBudgetklasse = useCallback((budgetklasse: BudgetKlasse) => {
    setState((s) => ({ ...s, budgetklasse, stap: s.stap < 5 ? 5 : s.stap }));
  }, []);

  const setFrequentie = useCallback((frequentie: GebruikFrequentie) => {
    setState((s) => ({ ...s, frequentie, stap: s.stap < 6 ? 6 : s.stap }));
  }, []);

  const setDoel = useCallback((doel: Doel) => {
    setState((s) => ({ ...s, doel }));
  }, []);

  const vorigeStap = useCallback(() => {
    setState((s) => {
      const eersteStap = initieSport ? 2 : 1;
      return { ...s, stap: Math.max(eersteStap, s.stap - 1) };
    });
  }, [initieSport]);

  const volgendeStap = useCallback(() => {
    setState((s) => ({ ...s, stap: Math.min(6, s.stap + 1) }));
  }, []);

  const gaNaarStap = useCallback((stap: number) => {
    setState((s) => ({ ...s, stap }));
  }, []);

  const isCompleet =
    state.sport !== null &&
    state.geslacht !== null &&
    state.niveau !== null &&
    state.budgetklasse !== null &&
    state.frequentie !== null &&
    state.doel !== null;

  return (
    <WizardContext.Provider
      value={{
        state,
        setSport,
        setGeslacht,
        setNiveau,
        setBudgetklasse,
        setFrequentie,
        setDoel,
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
