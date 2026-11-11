-- Productos mencionados en el contexto del proyecto. Precios y stock se cargan desde /admin.
insert into products (name, description, category, sort_order) values
  ('Rolls de canela',     'Clásicos, esponjosos y con mucha canela.',        'pasteleria', 1),
  ('Budín de naranja',    'Húmedo y con aroma a naranja.',                   'pasteleria', 2),
  ('Budín marmolado',     'Vainilla y chocolate en cada porción.',           'pasteleria', 3),
  ('Pan dulce 250 g',     'Para compartir en la mesa.',                      'pasteleria', 4),
  ('Pan dulce 100 g',     'Tamaño individual.',                              'pasteleria', 5),
  ('Torta brownie',       'Intensa, de chocolate. Se pide con anticipación.', 'a_pedido', 6),
  ('Torta de chocolate',  'Para cumpleaños y reuniones.',                    'a_pedido', 7),
  ('Lemon pie',           'Crema de limón y merengue.',                      'a_pedido', 8),
  ('Torta chajá',         'Clásico uruguayo.',                               'a_pedido', 9),
  ('Café de especialidad','Para armar la merienda completa.',                'acompanar', 10);
