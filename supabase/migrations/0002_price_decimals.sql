-- Los precios admiten centésimos (UYU con 2 decimales). El cambio de integer a numeric no pierde datos.
alter table products alter column price type numeric(10, 2);
