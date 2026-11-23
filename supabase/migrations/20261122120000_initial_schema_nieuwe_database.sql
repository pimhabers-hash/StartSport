-- Volledig schema voor een gloednieuw Supabase-project, gereconstrueerd
-- uit het daadwerkelijke gebruik in de code (het oude project is
-- onbereikbaar geworden door een organisatie-brede Fair Use-restrictie
-- wegens overschreden databasegrootte, en bood geen enkele toegang meer
-- om zelf een dump te trekken). lib/supabase/database.types.ts bleek
-- hierbij zelf verouderd (miste o.a. feed_subscriptions, articles en
-- products.geslacht) en is dus NIET als bron gebruikt, enkel de
-- werkelijke queries in app/**, lib/** en middleware.ts.
--
-- Volgorde draait eenmalig in een leeg project; bedoeld om in één keer
-- in de SQL Editor van het nieuwe project te plakken en uit te voeren.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type ervaring_niveau as enum ('beginner', 'gemiddeld', 'gevorderd', 'competitie');
create type budget_klasse as enum ('budget', 'middenklasse', 'premium');
create type gebruik_frequentie as enum ('recreatief', 'wekelijks', 'intensief');
create type binnen_buiten_type as enum ('binnen', 'buiten', 'beide');
create type user_rol as enum ('admin', 'gebruiker');
create type product_geslacht as enum ('man', 'vrouw', 'unisex');

-- ---------------------------------------------------------------------
-- sports
-- ---------------------------------------------------------------------
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  slug text not null unique,
  beschrijving text,
  binnen_buiten binnen_buiten_type not null default 'beide',
  icoon text,
  actief boolean not null default true,
  volgorde integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  slug text not null unique,
  icoon text,
  volgorde integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  slug text not null unique,
  logo_url text,
  affiliate_netwerk text,
  actief boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  merk text,
  sport_id uuid references public.sports(id) on delete set null,
  category_id uuid not null references public.categories(id),
  provider_id uuid references public.providers(id) on delete set null,
  prijs numeric not null,
  valuta text not null default 'EUR',
  niveau ervaring_niveau[] not null default '{}',
  budgetklasse budget_klasse not null,
  geslacht product_geslacht,
  geschikt_voor_frequentie gebruik_frequentie[] not null default '{}',
  affiliate_url text not null,
  afbeelding_url text,
  uitleg text,
  score numeric not null default 4.0,
  actief boolean not null default true,
  geclassificeerd boolean not null default false,
  bron text,
  ean text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Zelfde unique index als de bestaande migratie
-- (20260807093000_fix_products_naam_constraint.sql): PostgREST's
-- upsert(onConflict:...) kan alleen kolomnamen targeten, geen
-- expressie-index, dus de index staat op de kolom zelf, niet lower(naam).
create unique index products_provider_naam_uniek
  on public.products (provider_id, naam);

create index products_sport_id_idx on public.products (sport_id);
create index products_category_id_idx on public.products (category_id);
create index products_provider_id_idx on public.products (provider_id);
create index products_actief_idx on public.products (actief);

-- ---------------------------------------------------------------------
-- feed_subscriptions
-- ---------------------------------------------------------------------
create table public.feed_subscriptions (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  feed_url text not null,
  sport_id uuid references public.sports(id) on delete set null,
  provider_id uuid not null references public.providers(id),
  grens_budget numeric not null default 50,
  grens_midden numeric not null default 150,
  actief boolean not null default true,
  laatste_sync timestamptz,
  laatste_resultaat text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  slug text not null unique,
  samenvatting text not null,
  inhoud text not null,
  sport_id uuid references public.sports(id) on delete set null,
  gepubliceerd boolean not null default false,
  auteur_naam text,
  auteur_rol text,
  auteur_bio text,
  faq jsonb not null default '[]',
  laatst_bijgewerkt date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles (1-op-1 met auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol user_rol not null default 'gebruiker',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- configurator_results (nooit actief geschreven in de huidige code,
-- maar het admin-dashboard telt 'm — zie app/admin/page.tsx)
-- ---------------------------------------------------------------------
create table public.configurator_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  sport_id uuid not null references public.sports(id),
  niveau ervaring_niveau not null,
  budgetklasse budget_klasse not null,
  frequentie gebruik_frequentie not null,
  binnen_buiten binnen_buiten_type,
  gekozen_producten uuid[] not null default '{}',
  totaalprijs numeric,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- affiliate_clicks
-- provider_id is bewust TEXT, geen FK: de huidige frontend-code
-- (components/resultaat/ProductKaart.tsx) stuurt de providernaam i.p.v.
-- een echt provider-id mee (een bestaande bug, los van deze migratie) —
-- een strikte uuid-FK zou elke insert laten mislukken.
-- ---------------------------------------------------------------------
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  configurator_result_id uuid references public.configurator_results(id) on delete set null,
  provider_id text,
  session_id text,
  clicked_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

alter table public.sports enable row level security;
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.products enable row level security;
alter table public.feed_subscriptions enable row level security;
alter table public.articles enable row level security;
alter table public.profiles enable row level security;
alter table public.configurator_results enable row level security;
alter table public.affiliate_clicks enable row level security;

-- Expliciete API-rechten: "automatically grant API access" staat uit op
-- dit project, dus zonder deze GRANTs ziet de Data API (PostgREST) deze
-- tabellen helemaal niet, los van wat de RLS-policies hierboven zouden
-- toestaan. RLS blijft daarna bepalen WELKE RIJEN precies zichtbaar/
-- schrijfbaar zijn — dit regelt alleen OF de rol de tabel mag aanspreken.
grant usage on schema public to anon, authenticated;

grant select on public.sports, public.categories, public.providers, public.products
  to anon, authenticated;
grant insert, update, delete on public.sports, public.categories, public.providers, public.products
  to authenticated;

grant select, insert, update, delete on public.feed_subscriptions to authenticated;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

grant select on public.profiles to authenticated;

grant select, insert, update, delete on public.configurator_results to authenticated;

grant insert on public.affiliate_clicks to anon, authenticated;
grant select, update, delete on public.affiliate_clicks to authenticated;

-- service_role (lib/sync-feeds.ts en de cron-route) blijkt met
-- "automatically grant API access" uit GEEN automatische rechten te
-- krijgen, ook al omzeilt die rol RLS toch al volledig — vandaar
-- expliciet alles toekennen, dit biedt geen extra veiligheidsrisico.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;

-- sports: publiek leesbaar, admin schrijft
create policy "sports_select_public" on public.sports for select using (true);
create policy "sports_write_admin" on public.sports for all using (public.is_admin()) with check (public.is_admin());

-- categories: publiek leesbaar, admin schrijft
create policy "categories_select_public" on public.categories for select using (true);
create policy "categories_write_admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- providers: publiek leesbaar, admin schrijft
create policy "providers_select_public" on public.providers for select using (true);
create policy "providers_write_admin" on public.providers for all using (public.is_admin()) with check (public.is_admin());

-- products: publiek leesbaar, admin + service-role schrijven
-- (service-role omzeilt RLS automatisch, dus alleen de admin-policy is nodig)
create policy "products_select_public" on public.products for select using (true);
create policy "products_write_admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- feed_subscriptions: nooit publiek, alleen admin (sync-feeds.ts gebruikt
-- de service-role key en omzeilt RLS dus altijd)
create policy "feed_subscriptions_admin" on public.feed_subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- articles: publiek alleen gepubliceerde, admin ziet + schrijft alles
create policy "articles_select_published" on public.articles for select using (gepubliceerd = true);
create policy "articles_select_admin" on public.articles for select using (public.is_admin());
create policy "articles_write_admin" on public.articles for insert with check (public.is_admin());
create policy "articles_update_admin" on public.articles for update using (public.is_admin()) with check (public.is_admin());
create policy "articles_delete_admin" on public.articles for delete using (public.is_admin());

-- profiles: iedereen mag alleen zijn eigen rij lezen (nodig voor de
-- middleware-rolcheck); schrijven gebeurt niet via de app zelf.
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());

-- configurator_results: nooit publiek, admin leest (dashboard-telling)
create policy "configurator_results_admin" on public.configurator_results for all using (public.is_admin()) with check (public.is_admin());

-- affiliate_clicks: iedereen mag INSERTEN (anonieme klik-tracking,
-- geen sessie nodig), alleen admin mag lezen/aanpassen/verwijderen.
create policy "affiliate_clicks_insert_public" on public.affiliate_clicks for insert with check (true);
create policy "affiliate_clicks_select_admin" on public.affiliate_clicks for select using (public.is_admin());
create policy "affiliate_clicks_update_admin" on public.affiliate_clicks for update using (public.is_admin()) with check (public.is_admin());
create policy "affiliate_clicks_delete_admin" on public.affiliate_clicks for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: categories — FUNCTIONEEL VERPLICHT. De classificatielogica in
-- lib/feed-import.ts (CATEGORIE_TREFWOORDEN, CATEGORIE_PRIORITEIT) matcht
-- op exact deze slugs; zonder deze rijen classificeert de sync-feeds-cron
-- geen enkel product (matchCategorie() geeft dan altijd null terug).
-- Volgorde-waarden volgen CATEGORIE_PRIORITEIT uit die file.
-- ---------------------------------------------------------------------
insert into public.categories (naam, slug, volgorde) values
  ('Tassen', 'tassen', 10),
  ('Schoenen', 'schoenen', 20),
  ('Bovenkleding', 'bovenkleding', 30),
  ('Onderkleding', 'onderkleding', 40),
  ('Kleding', 'kleding', 50),
  ('Ballen', 'ballen', 60),
  ('Vitaminen en supplementen', 'vitaminen-en-supplementen', 70),
  ('Vistuig', 'vistuig', 80),
  ('Rijuitrusting', 'rijuitrusting', 90),
  ('Accessoires', 'accessoires', 100),
  ('Voeding', 'voeding', 110),
  ('Bescherming', 'bescherming', 120),
  ('Racket', 'racket', 130),
  ('Clubs', 'clubs', 140),
  ('Sticks', 'sticks', 150),
  ('Boards', 'boards', 160),
  ('Fietsen', 'fietsen-categorie', 170);

-- ---------------------------------------------------------------------
-- Seed: sports — afgeleid uit SPORT_TREFWOORDEN in lib/sport-match.ts,
-- zodat matchSport() tijdens de eerste sync meteen geldige sport_id's
-- kan vinden. Namen/binnen-buiten zijn redelijke, feitelijke
-- standaardwaarden; beschrijving/afbeelding/volgorde zijn bewust leeg
-- gelaten (geen site-specifieke content te reconstrueren uit code) —
-- vul die naar smaak aan via /admin/sporten.
-- ---------------------------------------------------------------------
insert into public.sports (naam, slug, binnen_buiten) values
  ('Padel', 'padel', 'beide'),
  ('Tennis', 'tennis', 'beide'),
  ('Pickleball', 'pickleball', 'beide'),
  ('Hardlopen', 'hardlopen', 'buiten'),
  ('Fitness', 'fitness', 'binnen'),
  ('Volleybal', 'volleybal', 'beide'),
  ('Voetbal', 'voetbal', 'buiten'),
  ('Wandelen', 'wandelen', 'buiten'),
  ('Wintersport', 'wintersport', 'buiten'),
  ('Golf', 'golf', 'buiten'),
  ('Hockey', 'hockey', 'beide'),
  ('Zwemmen', 'zwemmen', 'binnen'),
  ('Fietsen', 'fietsen', 'buiten'),
  ('Basketbal', 'basketbal', 'beide'),
  ('Zeilen', 'zeilen', 'buiten'),
  ('Badminton', 'badminton', 'binnen'),
  ('Turnen', 'turnen', 'binnen'),
  ('Tafeltennis', 'tafeltennis', 'binnen'),
  ('Handbal', 'handbal', 'binnen'),
  ('Klimmen', 'klimmen', 'beide'),
  ('Duiken', 'duiken', 'buiten'),
  ('Suppen', 'suppen', 'buiten'),
  ('Skateboarden', 'skateboarden', 'buiten'),
  ('Trampolinespringen', 'trampolinespringen', 'beide'),
  ('Surfen', 'surfen', 'buiten'),
  ('Paardrijden', 'paardrijden', 'buiten'),
  ('Vechtsporten', 'vechtsporten', 'binnen'),
  ('Hengelsport', 'hengelsport', 'buiten'),
  ('Rugby', 'rugby', 'buiten'),
  ('Dansen', 'dansen', 'binnen'),
  ('Kajakken', 'kajakken', 'buiten'),
  ('Boogschieten', 'boogschieten', 'beide'),
  ('Squash', 'squash', 'binnen'),
  ('Darten', 'darten', 'binnen'),
  ('Honkbal', 'honkbal', 'buiten'),
  ('Floorball', 'floorball', 'binnen'),
  ('Schermen', 'schermen', 'binnen'),
  ('Boksen', 'boksen', 'binnen');
