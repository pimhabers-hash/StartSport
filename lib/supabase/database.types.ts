export type ErvaringNiveau = "beginner" | "gemiddeld" | "gevorderd" | "competitie";
export type BudgetKlasse = "budget" | "middenklasse" | "premium";
export type GebruikFrequentie = "recreatief" | "wekelijks" | "intensief";
export type PakketNiveau = "starter" | "advanced" | "premium";
export type BinnenBuiten = "binnen" | "buiten" | "beide";
export type UserRol = "admin" | "gebruiker";

export interface Database {
  public: {
    Tables: {
      sports: {
        Row: {
          id: string;
          naam: string;
          slug: string;
          afbeelding_url: string | null;
          beschrijving: string | null;
          binnen_buiten: BinnenBuiten;
          actief: boolean;
          volgorde: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sports"]["Row"]> & {
          naam: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["sports"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          naam: string;
          slug: string;
          icoon: string | null;
          volgorde: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          naam: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          naam: string;
          slug: string;
          logo_url: string | null;
          affiliate_netwerk: string | null;
          actief: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["providers"]["Row"]> & {
          naam: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["providers"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          naam: string;
          merk: string | null;
          sport_id: string;
          category_id: string;
          provider_id: string | null;
          prijs: number;
          valuta: string;
          niveau: ErvaringNiveau[];
          budgetklasse: BudgetKlasse;
          geschikt_voor_frequentie: GebruikFrequentie[];
          affiliate_url: string;
          afbeelding_url: string | null;
          uitleg: string | null;
          score: number;
          actief: boolean;
          geclassificeerd: boolean;
          bron: string;
          ean: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          naam: string;
          sport_id: string;
          category_id: string;
          prijs: number;
          budgetklasse: BudgetKlasse;
          affiliate_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "products_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          }
        ];
      };
      packages: {
        Row: {
          id: string;
          naam: string;
          sport_id: string;
          pakket_niveau: PakketNiveau;
          beschrijving: string | null;
          actief: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["packages"]["Row"]> & {
          naam: string;
          sport_id: string;
          pakket_niveau: PakketNiveau;
        };
        Update: Partial<Database["public"]["Tables"]["packages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "packages_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          }
        ];
      };
      package_items: {
        Row: {
          id: string;
          package_id: string;
          product_id: string;
          verplicht: boolean;
          volgorde: number;
        };
        Insert: Partial<Database["public"]["Tables"]["package_items"]["Row"]> & {
          package_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["package_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "package_items_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      configurator_results: {
        Row: {
          id: string;
          user_id: string | null;
          sport_id: string;
          niveau: ErvaringNiveau;
          budgetklasse: BudgetKlasse;
          frequentie: GebruikFrequentie;
          binnen_buiten: BinnenBuiten | null;
          gekozen_producten: string[];
          totaalprijs: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["configurator_results"]["Row"]> & {
          sport_id: string;
          niveau: ErvaringNiveau;
          budgetklasse: BudgetKlasse;
          frequentie: GebruikFrequentie;
        };
        Update: Partial<Database["public"]["Tables"]["configurator_results"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "configurator_results_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          }
        ];
      };
      affiliate_clicks: {
        Row: {
          id: string;
          product_id: string;
          configurator_result_id: string | null;
          provider_id: string | null;
          session_id: string | null;
          clicked_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["affiliate_clicks"]["Row"]> & {
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_clicks"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          rol: UserRol;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}