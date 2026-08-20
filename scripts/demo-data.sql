-- Datos de demostración para capturas de pantalla.
--
-- SOLO LOCAL. Se ejecuta con `npm run demo:seed`, que comprueba que apunta a la
-- instancia local antes de correr. Nunca contra producción: son pedidos falsos
-- y contaminarían métricas, CRM e historial reales.
--
-- Todo lo que crea lleva prefijo reconocible —`de00` en pedidos y `dec0` en
-- contactos—, así que volver a ejecutarlo reemplaza la tanda anterior en vez de
-- acumular.
--
-- Los correos y celulares son inventados con formato real. Podrían coincidir
-- con los de alguna persona: si la captura se va a publicar, recorta o difumina
-- esa columna.

begin;

-- Limpieza de la tanda anterior. El borrado en cascada se lleva notas e
-- historial asociados.
delete from public.orders_cod where id::text like 'de00%';
delete from public.contacts where id::text like 'dec0%';

-- Fuera también todo lo que use `@example.com`: los datos de desarrollo de
-- `seed.sql` —"Cliente Local", "Pedido en Camino", celulares como 3000000000— y
-- los que dejan `supabase:verify` y las pruebas manuales. En una captura se ven
-- obviamente falsos y conviven con los de demostración en las mismas pantallas.
--
-- El dominio `example.com` está reservado justamente para ejemplos, así que
-- ningún dato de demostración legítimo lo usa: los de aquí van a gmail,
-- hotmail y outlook.
--
-- `npm run supabase:reset` los devuelve para trabajar en local.
delete from public.orders_cod where email like '%@example.com';
delete from public.contacts where email like '%@example.com';

-- El límite antiabuso rechaza más de 3 pedidos por correo o celular en una
-- hora, y aquí se insertan de golpe. Se desactiva solo dentro de esta
-- transacción: si algo falla, el rollback lo restablece.
alter table public.orders_cod disable trigger orders_cod_rate_limit;

-- ---------------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------------

create temporary table demo_people (
  idx int primary key,
  full_name text,
  email text,
  phone text,
  city text,
  address text
) on commit drop;

insert into demo_people values
  (1,'Laura Restrepo Gómez','laura.restrepog@gmail.com','3113472890','Bogotá','Carrera 15 # 93-47 Apto 502'),
  (2,'Andrés Felipe Cardona','af.cardona82@hotmail.com','3005218844','Medellín','Calle 10 # 43D-25 Torre 2 Apto 803'),
  (3,'Diana Marcela Ospina','dianam.ospina@gmail.com','3187740215','Cali','Avenida 6N # 28-10 Apto 401'),
  (4,'Juan Camilo Herrera','jc.herrera91@outlook.com','3126650473','Bogotá','Transversal 60 # 114-32'),
  (5,'Paola Andrea Jiménez','paojimenez.a@gmail.com','3204418907','Barranquilla','Carrera 53 # 79-115 Apto 902'),
  (6,'Ricardo Montoya Vélez','r.montoyav@gmail.com','3153309628','Medellín','Circular 4 # 70-40 Apto 201'),
  (7,'Catalina Ruiz Salazar','cata.ruizs@hotmail.com','3016624180','Bucaramanga','Calle 48 # 33-15'),
  (8,'Sebastián Duarte Pineda','sduarte.pineda@gmail.com','3178851042','Bogotá','Calle 134 # 7-83 Apto 1104'),
  (9,'Mónica Lucía Ángel','monica.angel7@gmail.com','3142207736','Pereira','Carrera 14 # 20-45'),
  (10,'Carlos Eduardo Rincón','ce.rincon@outlook.com','3009973551','Cartagena','Carrera 2 # 11-41 Edificio Marbella'),
  (11,'Valentina Mejía Ochoa','vale.mejiao@gmail.com','3196648023','Medellín','Carrera 43A # 6 Sur-15 Apto 1502'),
  (12,'Óscar Iván Betancur','oi.betancur@gmail.com','3113058497','Manizales','Calle 65 # 23-40'),
  (13,'Natalia Fernanda Solís','nataliasolis.f@hotmail.com','3025519374','Bogotá','Carrera 11 # 82-71 Oficina 401'),
  (14,'Julián Andrés Parra','julian.parra88@gmail.com','3167742019','Cúcuta','Avenida 0 # 12-38'),
  (15,'Sandra Milena Torres','smtorres.co@gmail.com','3132286645','Cali','Calle 5 # 66-30 Apto 703'),
  (16,'Felipe Arango Zuluaga','felipe.arangoz@outlook.com','3008834710','Medellín','Calle 33 # 76-19'),
  (17,'Ana María Villalobos','anam.villalobos@gmail.com','3151160982','Bogotá','Diagonal 61C # 26-40 Apto 302'),
  (18,'Mauricio Lozano Ríos','m.lozanorios@gmail.com','3184425307','Ibagué','Carrera 5 # 37-22'),
  (19,'Carolina Espinosa León','caro.espinosal@hotmail.com','3115592864','Santa Marta','Calle 22 # 3-45 Apto 604'),
  (20,'David Santiago Muñoz','ds.munozr@gmail.com','3023370159','Bogotá','Carrera 7 # 122-15 Apto 205'),
  (21,'Lina Patricia Guzmán','lina.guzmanp@gmail.com','3197708423','Villavicencio','Calle 35 # 30-18'),
  (22,'Esteban Correa Uribe','esteban.correau@gmail.com','3141863270','Medellín','Carrera 25 # 1A Sur-45 Apto 1001'),
  (23,'Marcela Yepes Cano','marcelayepes.c@outlook.com','3009925618','Cali','Carrera 100 # 11-60 Casa 14'),
  (24,'Alejandro Pardo Nieto','a.pardonieto@gmail.com','3176640935','Bogotá','Calle 100 # 19-54 Oficina 802'),
  (25,'Gloria Inés Bedoya','gloria.bedoya@hotmail.com','3124451782','Pereira','Avenida Circunvalar # 12-30 Apto 501'),
  (26,'Nicolás Ramírez Peña','nico.ramirezp@gmail.com','3188817046','Barranquilla','Carrera 51B # 80-58 Apto 1203'),
  (27,'Adriana Sofía Molina','adriana.molinas@gmail.com','3016673429','Bogotá','Transversal 93 # 53-48 Casa 7'),
  (28,'Camilo Andrés Vargas','camilo.vargasa@outlook.com','3153328950','Medellín','Calle 44 # 79-120 Apto 402'),
  (29,'Isabel Cristina Tobón','isa.tobonc@gmail.com','3202215687','Cartagena','Carrera 4 # 8-25 Edificio Portobelo'),
  (30,'Jorge Enrique Salcedo','je.salcedo@gmail.com','3117749813','Cúcuta','Calle 10 # 5-62'),
  (31,'Daniela Quintero Ávila','dani.quinteroa@gmail.com','3005584276','Bogotá','Calle 116 # 15-45 Apto 703'),
  (32,'Hernán Darío Cifuentes','hd.cifuentes@hotmail.com','3169930451','Manizales','Carrera 23 # 62-16'),
  (33,'Tatiana Alexandra Ríos','tatiana.riosa@gmail.com','3131107628','Cali','Calle 9 # 50-30 Apto 806'),
  (34,'Santiago Betancourt Gil','santi.betancourt@gmail.com','3186642390','Medellín','Carrera 48 # 20-114 Apto 1704'),
  (35,'Verónica Naranjo Duque','vero.naranjod@outlook.com','3024478165','Bogotá','Carrera 13 # 63-39 Apto 301'),
  (36,'Iván Mauricio Cuervo','ivan.cuervom@gmail.com','3147752904','Bucaramanga','Calle 36 # 27-40'),
  (37,'Juliana Marín Castaño','juliana.marinc@gmail.com','3112238547','Bogotá','Calle 85 # 12-18 Apto 604'),
  (38,'Fernando Acosta Rivera','f.acostarivera@gmail.com','3008816273','Medellín','Carrera 70 # 45-30 Apto 205'),
  (39,'Claudia Patricia Rueda','claudia.ruedap@hotmail.com','3195540918','Cali','Calle 15 # 100-25 Casa 8'),
  (40,'Miguel Ángel Pinzón','ma.pinzon@gmail.com','3173364250','Bogotá','Carrera 19 # 104-60 Apto 402'),
  (41,'Ángela María Escobar','angela.escobarm@gmail.com','3129971486','Barranquilla','Calle 84 # 47-20 Apto 705'),
  (42,'Rodrigo Salinas Peña','rodrigo.salinasp@outlook.com','3016628037','Bogotá','Avenida 68 # 40-55'),
  (43,'Lorena Castrillón Vega','lorena.castrillon@gmail.com','3184402759','Medellín','Calle 30A # 82-40 Apto 1102'),
  (44,'Álvaro José Mendoza','aj.mendoza@gmail.com','3143307164','Santa Marta','Carrera 3 # 17-27'),
  (45,'Sara Isabel Gutiérrez','sara.gutierrezi@gmail.com','3007745892','Bogotá','Calle 72 # 10-34 Oficina 601'),
  (46,'Emilio Vanegas Prieto','emilio.vanegasp@gmail.com','3192274608','Cali','Calle 44 # 3A-15 Apto 502'),
  (47,'Rocío del Pilar Amaya','rocio.amayap@hotmail.com','3106639271','Bogotá','Carrera 24 # 63C-30'),
  (48,'Jhon Fredy Zapata','jf.zapata@gmail.com','3021185940','Medellín','Calle 55 # 45-18 Apto 305'),
  (49,'Beatriz Elena Uribe','beatriz.uribee@gmail.com','3158802463','Envigado','Carrera 42 # 38 Sur-25 Apto 901'),
  (50,'Andrés Mauricio Rojas','am.rojas77@outlook.com','3134470826','Bogotá','Calle 145 # 20-56 Apto 404'),
  (51,'Luz Adriana Ocampo','luz.ocampoa@gmail.com','3177725619','Armenia','Carrera 18 # 12-40'),
  (52,'Carlos Alberto Nieto','ca.nieto@gmail.com','3009964152','Cartagena','Calle 30 # 21-19 Apto 703'),
  (53,'Mariana Sánchez Prada','mariana.sanchezp@gmail.com','3195518743','Bogotá','Carrera 9 # 70-27 Oficina 302'),
  (54,'Gustavo Adolfo Peña','ga.pena@hotmail.com','3141136028','Bucaramanga','Carrera 27 # 42-30'),
  (55,'Silvia Juliana Roldán','silvia.roldanj@gmail.com','3186674395','Medellín','Calle 7 Sur # 42-70 Apto 1203'),
  (56,'Édgar Alonso Trujillo','edgar.trujilloa@gmail.com','3023390714','Neiva','Calle 8 # 5-42'),
  (57,'Paula Cristina Bernal','paula.bernalc@outlook.com','3117786250','Bogotá','Calle 90 # 11A-27 Apto 802'),
  (58,'Fabián Ricardo Osorio','fabian.osoriorr@gmail.com','3164429831','Pereira','Calle 21 # 8-35'),
  (59,'Ligia Esther Camargo','ligia.camargoe@gmail.com','3005547096','Santa Marta','Carrera 5 # 22-18 Apto 401'),
  (60,'Óscar Julián Vega','oj.vega@gmail.com','3199962374','Cúcuta','Avenida 5 # 14-52');

-- Una ficha por persona. Se crean antes que los pedidos para que el trigger de
-- vinculación las reutilice y los identificadores queden bajo el prefijo.
insert into public.contacts (id, full_name, email, phone, city, stage, source, created_at)
select
  ('dec0' || lpad(to_hex(idx), 4, '0') || '-0000-4000-8000-' || lpad(idx::text, 12, '0'))::uuid,
  full_name, email, phone, city, 'cliente', 'pedido', now() - interval '95 days'
from demo_people;

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
--
-- Uno a tres pedidos por día durante 90 días. La rotación de personas es
-- aritmética y no aleatoria, así que el resultado es reproducible; algunas
-- repiten compra, que es justo lo que hace interesante la ficha del CRM.

create temporary table demo_slots (
  n int,
  person_idx int,
  days_ago int,
  slot int,
  hour_offset int
) on commit drop;

insert into demo_slots (n, person_idx, days_ago, slot, hour_offset)
select
  row_number() over (order by d.days_ago desc, s.slot),
  ((d.days_ago * 7 + s.slot * 13) % 60) + 1,
  d.days_ago,
  s.slot,
  -- Reparte las horas dentro del día laboral.
  9 + ((d.days_ago + s.slot * 3) % 10)
from generate_series(0, 89) as d(days_ago)
cross join lateral generate_series(
  1,
  -- Hoy lleva más pedidos: es el día que se ve en la captura del panel.
  case when d.days_ago = 0 then 8 else 1 + ((d.days_ago * 5 + 3) % 3) end
) as s(slot);

insert into public.orders_cod (id, full_name, email, phone, city, address, status, created_at)
select
  ('de00' || lpad(to_hex(sl.n::int), 4, '0') || '-0000-4000-8000-' || lpad(sl.n::text, 12, '0'))::uuid,
  p.full_name, p.email, p.phone, p.city, p.address,
  case
    -- Hoy: casi todo sin tocar todavía.
    when sl.days_ago = 0 then case when sl.n % 3 = 0 then 'confirmed' else 'pending' end
    when sl.days_ago <= 2 then case when sl.n % 4 = 0 then 'pending' else 'confirmed' end
    when sl.days_ago <= 6 then 'shipped'
    -- Antiguos: mayormente entregados. Las ciudades con más entregas fallidas
    -- son las que hacen útil el desglose por ciudad.
    when p.city in ('Cúcuta', 'Santa Marta') and sl.n % 3 = 0 then 'cancelled'
    when sl.n % 11 = 0 then 'cancelled'
    else 'delivered'
  end,
  case
    -- Los de hoy se cuelgan de la hora actual hacia atrás. Con una hora fija
    -- del día saldrían pedidos en el futuro si la captura se toma temprano.
    when sl.days_ago = 0 then now() - (sl.slot * interval '41 minutes')
    else (current_date - sl.days_ago) + (sl.hour_offset || ' hours')::interval
      + ((sl.n % 60) || ' minutes')::interval
  end
from demo_slots sl
join demo_people p on p.idx = sl.person_idx;

-- ---------------------------------------------------------------------------
-- Historial de estados
-- ---------------------------------------------------------------------------
--
-- El trigger ya escribió el evento de creación con la hora actual. Se reemplaza
-- por un recorrido coherente con la fecha de cada pedido, o en la ficha del
-- cliente todos parecerían haberse creado hoy.

delete from public.order_status_events
where order_id in (select id from public.orders_cod where id::text like 'de00%');

insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
select o.id, null, 'pending', null, o.created_at
from public.orders_cod o where o.id::text like 'de00%';

insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
select o.id, 'pending', 'confirmed', 'operacion@nitrolanding.co', o.created_at + interval '4 hours'
from public.orders_cod o
where o.id::text like 'de00%' and o.status in ('confirmed', 'shipped', 'delivered');

insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
select o.id, 'confirmed', 'shipped', 'operacion@nitrolanding.co', o.created_at + interval '1 day 3 hours'
from public.orders_cod o
where o.id::text like 'de00%' and o.status in ('shipped', 'delivered');

insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
select o.id, 'shipped', 'delivered', 'operacion@nitrolanding.co', o.created_at + interval '3 days 6 hours'
from public.orders_cod o
where o.id::text like 'de00%' and o.status = 'delivered';

insert into public.order_status_events (order_id, from_status, to_status, changed_by, created_at)
select o.id, 'pending', 'cancelled', 'operacion@nitrolanding.co', o.created_at + interval '1 day 2 hours'
from public.orders_cod o
where o.id::text like 'de00%' and o.status = 'cancelled';

-- ---------------------------------------------------------------------------
-- Prospectos del CRM
-- ---------------------------------------------------------------------------
--
-- Gente que escribió y todavía no compra. Varios con el próximo contacto para
-- hoy o vencido, que es lo que llena la bandeja de pendientes.

insert into public.contacts (id, full_name, email, phone, city, stage, source, next_follow_up, created_at)
values
  ('dec00101-0000-4000-8000-000000000101','Marta Lucía Peláez',null,'3158824061','Bogotá','por_contactar','whatsapp', current_date, now() - interval '2 days'),
  ('dec00102-0000-4000-8000-000000000102','Germán Ospina Cárdenas','german.ospinac@gmail.com','3117763309','Medellín','reagendar','whatsapp', current_date, now() - interval '4 days'),
  ('dec00103-0000-4000-8000-000000000103','Yenny Paola Aguirre',null,'3024419875','Cali','no_contesta','whatsapp', current_date - 1, now() - interval '6 days'),
  ('dec00104-0000-4000-8000-000000000104','Luis Fernando Rojas','lf.rojas@gmail.com','3186630247','Bogotá','por_contactar','lead', current_date + 2, now() - interval '3 days'),
  ('dec00105-0000-4000-8000-000000000105','Paula Andrea Chaves','paula.chavesa@hotmail.com',null,'Bucaramanga','nuevo','lead', null, now() - interval '1 day'),
  ('dec00106-0000-4000-8000-000000000106','Wilson Alberto Cruz',null,'3009951730','Pereira','perdido','whatsapp', null, now() - interval '20 days'),
  ('dec00107-0000-4000-8000-000000000107','Norma Constanza Ariza',null,'3141169035','Villavicencio','por_contactar','whatsapp', current_date, now() - interval '1 day'),
  ('dec00108-0000-4000-8000-000000000108','Héctor Fabio Loaiza','hf.loaiza@gmail.com','3005573418','Armenia','reagendar','lead', current_date - 2, now() - interval '9 days'),
  ('dec00109-0000-4000-8000-000000000109','Sandra Viviana Cortés',null,'3196682740','Ibagué','no_contesta','whatsapp', current_date, now() - interval '5 days'),
  ('dec00110-0000-4000-8000-000000000110','Rubén Darío Marulanda','rd.marulanda@outlook.com','3172219586','Manizales','nuevo','whatsapp', null, now() - interval '6 hours');

-- ---------------------------------------------------------------------------
-- Notas
-- ---------------------------------------------------------------------------

insert into public.contact_notes (contact_id, body, author_email, created_at)
values
  ('dec00101-0000-4000-8000-000000000101','Escribió por WhatsApp preguntando si el molino viene incluido. Le confirmé que sí y le pasé el precio. Quedó de responder hoy.','operacion@nitrolanding.co', now() - interval '1 day'),
  ('dec00102-0000-4000-8000-000000000102','Le interesa pero pidió que lo buscara después del día de pago. Reagendado.','operacion@nitrolanding.co', now() - interval '3 days'),
  ('dec00103-0000-4000-8000-000000000103','Dos llamadas sin respuesta. Le dejé mensaje por WhatsApp.','operacion@nitrolanding.co', now() - interval '2 days'),
  ('dec00106-0000-4000-8000-000000000106','Dijo que ya compró otra cafetera. Cerrado.','operacion@nitrolanding.co', now() - interval '18 days'),
  ('dec00107-0000-4000-8000-000000000107','Preguntó por el envío a Villavicencio. Le confirmé 2 a 5 días hábiles.','operacion@nitrolanding.co', now() - interval '20 hours'),
  ('dec00108-0000-4000-8000-000000000108','Descargó la guía y respondió el correo. Pidió llamarlo el fin de semana.','operacion@nitrolanding.co', now() - interval '8 days'),
  ('dec0000e-0000-4000-8000-000000000014','La transportadora reportó dirección incorrecta y no contestó el teléfono. Se canceló el despacho.','operacion@nitrolanding.co', now() - interval '14 days'),
  ('dec0001e-0000-4000-8000-000000000030','Confirmó por teléfono. Pidió entrega en la tarde.','operacion@nitrolanding.co', now() - interval '3 days'),
  ('dec00001-0000-4000-8000-000000000001','Cliente que repite. Preguntó por filtros de repuesto.','operacion@nitrolanding.co', now() - interval '10 days');

alter table public.orders_cod enable trigger orders_cod_rate_limit;

commit;
