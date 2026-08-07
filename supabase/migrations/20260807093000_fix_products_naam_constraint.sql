-- Vervangt de expressie-index (provider_id, lower(naam)) door een
-- gewone kolom-index, zodat Supabase's upsert(onConflict:...) 'm kan
-- targeten -- PostgREST ondersteunt alleen kolomlijsten, geen
-- expressies of constraint-namen in de on_conflict-parameter.
drop index if exists products_provider_naam_uniek;
create unique index if not exists products_provider_naam_uniek
  on products (provider_id, naam);
