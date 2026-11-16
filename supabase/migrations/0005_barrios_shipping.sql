-- Precio de envío del día por barrio (UYU). null = consultar.
alter table barrios
  add column if not exists shipping numeric(10, 2) check (shipping is null or shipping >= 0);

-- Valores actuales (antes vivían hardcodeados en web/components/cart/shipping.ts).
update barrios set shipping = 80 where id = 'parque-rodo';
update barrios set shipping = 100 where id = 'pocitos';
update barrios set shipping = 150 where id = 'punta-carretas';
update barrios set shipping = 200 where id = 'palermo';
update barrios set shipping = 220 where id = 'barrio-sur';
update barrios set shipping = 250 where id = 'centro';
update barrios set shipping = 280 where id = 'cordon';
update barrios set shipping = 300 where id = 'tres-cruces';
