-- Productos de la carta. Stock en unidades; 0 = sin stock.
create type product_category as enum ('pasteleria', 'a_pedido', 'acompanar');

create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  category    product_category not null,
  price       integer check (price >= 0),          -- pesos uruguayos; null = "consultar"
  stock       integer not null default 0 check (stock >= 0),
  image_path  text,                                 -- ruta dentro del bucket "products"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Solo el backend (service role) accede a la tabla; RLS sin políticas bloquea el resto.
alter table products enable row level security;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- Bucket público de lectura para las fotos; las escrituras pasan por el backend.
insert into storage.buckets (id, name, public) values ('products', 'products', true)
  on conflict (id) do nothing;
