-- Category values are stored in English; Spanish labels live in the web i18n catalog (web/lib/i18n/es.ts).
-- RENAME VALUE keeps every existing row. Run this BEFORE deploying the API/web release that expects the new values,
-- otherwise the catalog is read with categories the new code does not know. Safe to re-run.
do $$
declare
  pair text[];
begin
  foreach pair slice 1 in array array[
    array['pasteleria', 'desserts'],
    array['acompanar', 'coffees'],
    array['a_pedido', 'made_to_order']
  ] loop
    if exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'product_category' and e.enumlabel = pair[1]
    ) then
      execute format('alter type product_category rename value %L to %L', pair[1], pair[2]);
    end if;
  end loop;
end $$;
