-- Precio de envío del día por barrio (UYU). null = consultar.
-- Los valores se cargan/editan en la base o desde /admin → Barrios (no seed de tarifas aquí).
alter table barrios
  add column if not exists shipping numeric(10, 2) check (shipping is null or shipping >= 0);
