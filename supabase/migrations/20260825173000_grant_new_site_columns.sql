-- Permisos por columna para lo añadido hoy.
--
-- Este esquema concede `select` columna por columna, no por tabla. Añadir una
-- columna a una consulta existente sin conceder su permiso rompe la consulta
-- **entera**, no solo esa columna: Postgres rechaza el `select` completo.
--
-- Fue exactamente lo que pasó. `listSites()` empezó a pedir `production_url`
-- para mostrarle al cliente el enlace de su landing; sin el grant, la consulta
-- falló, la lista volvió vacía y el panel concluyó que el cliente no tenía
-- ninguna landing todavía. El dashboard dejó de abrirse para todos.

-- El cliente ve la dirección pública de su propia landing. `anon` no la
-- necesita: la landing pública ya sabe en qué URL vive.
grant select (production_url) on table public.sites to authenticated;

-- Qué campos exige el formulario. `anon` lo lee porque la landing que comparte
-- despliegue con la plataforma resuelve su configuración con la clave
-- publicable.
grant select (require_email, require_city) on table public.site_channels to anon, authenticated;

-- El cliente decide desde su panel si pide correo y ciudad.
grant update (require_email, require_city) on table public.site_channels to authenticated;
