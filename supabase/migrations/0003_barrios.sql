create table barrios (
  id         text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  name       text not null,
  geometry   jsonb not null,
  label      jsonb not null,
  neighbors  text[] not null default '{}',
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table barrios enable row level security;

create trigger barrios_updated_at before update on barrios
  for each row execute function set_updated_at();

create function set_enabled_barrios(ids text[]) returns void
language sql security invoker set search_path = ''
as $$ update public.barrios set enabled = (id = any(ids)) where enabled is distinct from (id = any(ids)) $$;

revoke execute on function set_enabled_barrios(text[]) from public, anon, authenticated;
