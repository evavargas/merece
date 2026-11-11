-- Todos los barrios de Montevideo con su polígono. `enabled` = zona con entrega (se ve en el mapa).
create table barrios (
  id         text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  name       text not null,
  geometry   jsonb not null,                 -- MultiPolygon GeoJSON: coordinates [[[lng, lat], ...]]
  label      jsonb not null,                 -- [lng, lat] donde va el nombre en el mapa
  neighbors  text[] not null default '{}',   -- barrios linderos, para asignar colores distintos
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Solo el backend (service role) accede; RLS sin políticas bloquea a anon/authenticated.
alter table barrios enable row level security;

create trigger barrios_updated_at before update on barrios
  for each row execute function set_updated_at();

-- Guarda la selección completa de una vez (atómico): habilita los ids dados y deshabilita el resto.
create function set_enabled_barrios(ids text[]) returns void
language sql security invoker set search_path = ''
as $$ update public.barrios set enabled = (id = any(ids)) where enabled is distinct from (id = any(ids)) $$;

revoke execute on function set_enabled_barrios(text[]) from public, anon, authenticated;
