-- Productos mencionados en el contexto del proyecto. Precios y stock se cargan desde /admin.
insert into products (name, description, category, sort_order) values
  ('Rolls de canela',     'Clásicos, esponjosos y con mucha canela y glaseados!.',        'pasteleria', 1),
  ('Budín de naranja',    'Húmedo y con aroma a naranja. Tev va a encantar',                   'pasteleria', 2),
  ('Budín marmolado',     'Vainilla y chocolate en cada porción. El mix perfecto',           'pasteleria', 3),
  ('Pan dulce 250 g',     'Para compartir en la mesa.',                      'pasteleria', 4),
  ('Pan dulce 100 g',     'Tamaño individual. Un antojo muy personal',                              'pasteleria', 5),
  ('Torta brownie',       'Intensa, de chocolate. Se pide con anticipación.', 'a_pedido', 6),
  ('Torta de chocolate',  'Para los apasionados por el chocolate.',                    'a_pedido', 7),
  ('Lemon pie',           'Crema de limón y merengue. Acido y dulce combinados a la perfección',                      'a_pedido', 8),
  ('Torta chajá',         'Clásico uruguayo. Ideal para cumpleaños',                               'a_pedido', 9),
  ('Café de especialidad','Para armar la merienda completa, y disfrutar como lo mereces',                'acompanar', 10);
