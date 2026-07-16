# Fase 3 — Next.js project opzetten

## Wat je nodig hebt
- **Node.js** versie 18 of hoger. Check met: `node -v`
  Niet geïnstalleerd? Download via [nodejs.org](https://nodejs.org) (kies de LTS-versie).
- VS Code (heb je al)

## Stappen

### 1. Maak een projectmap en open die in VS Code
Maak ergens op je computer een map `startsport`, en open die map in VS Code
(**File → Open Folder...**).

### 2. Plaats alle bestanden
Zet alle bestanden die ik je gaf in de juiste mapstructuur:

```
startsport/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── database.types.ts
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
└── .gitignore
```

### 3. Open een terminal in VS Code
**Terminal → New Terminal** (of Ctrl+`)

### 4. Installeer de dependencies

```bash
npm install
```

Dit duurt even — er wordt een `node_modules` map aangemaakt.

### 5. Maak je environment-bestand aan

```bash
cp .env.example .env.local
```

Open `.env.local` in VS Code en vul in:
- `NEXT_PUBLIC_SUPABASE_URL` — te vinden in Supabase: **Project Settings** (tandwiel) → **API** → "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — zelfde pagina, onder "Project API keys" → `anon` `public`
- `SUPABASE_SERVICE_ROLE_KEY` — zelfde pagina, de `service_role` key (geheim houden!)

### 6. Start het project

```bash
npm run dev
```

### 7. Open in de browser
Ga naar **http://localhost:3000**

Je zou moeten zien:
- "StartSport 🏆"
- Een blokje "Supabase-verbindingstest" met daarin de lijst sporten (Padel, Tennis, Hardlopen) — als het seed.sql-bestand uit Fase 2 succesvol is gedraaid.

Zie je een foutmelding in het blokje in plaats van de sporten? Dan klopt er iets niet met je `.env.local` — controleer of je de juiste URL/key hebt gekopieerd zonder spaties.

## Wat is hier nu opgezet?

- **`lib/supabase/client.ts`** — de client die je gebruikt in interactieve componenten (bijvoorbeeld: de configurator-wizard in Fase 5)
- **`lib/supabase/server.ts`** — de client voor server-side data ophalen (snel, SEO-vriendelijk, gebruikt op de homepage en productpagina's)
- **`lib/supabase/database.types.ts`** — TypeScript-types die exact overeenkomen met je databaseschema, zodat je in VS Code autocomplete krijgt op elke tabel en kolom
- **`app/page.tsx`** — een tijdelijke testpagina die bewijst dat de hele keten werkt: Next.js → Supabase → database

## Volgende stap

Werkt alles? Dan gaan we naar **Fase 4: de echte homepage bouwen** — met het premium, Apple/Nike-geïnspireerde design dat je in de briefing beschreef.
