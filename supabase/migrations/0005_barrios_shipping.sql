alter table barrios
  add column if not exists shipping numeric(10, 2) check (shipping is null or shipping >= 0);
