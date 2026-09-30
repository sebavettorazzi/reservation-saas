# Estado pre-viaje

Fecha: 2026-09-30

## Estado general

El proyecto esta listo para pruebas simulacro locales y para preparar un deploy demo controlado cuando vuelvas.

No esta recomendado publicarlo como SaaS real todavia porque faltan piezas de producto y operacion, especialmente WhatsApp real, recuperacion de contrasena y alta de negocios/admins sin seed.

## Listo

- Reserva publica para `2-de-abril`.
- Admin login.
- Dashboard por plan base/premium.
- Pestañas de Turnos, Configuracion y Estadisticas.
- Configuracion de horarios por cancha.
- Edicion de precios.
- Registro de gastos premium.
- Notificaciones WhatsApp simuladas.
- Bloqueo de reservas duplicadas activas.
- `npm run doctor` para revisar entorno local.
- `npm run smoke` para probar flujo cliente/admin.
- Guia de deploy en `docs/DEPLOY.md`.
- Variables ejemplo local y produccion.

## Verificaciones realizadas

- TypeScript OK.
- Doctor OK.
- Smoke test OK.
- Login admin responde OK.
- GitHub sincronizado al ultimo push conocido.

## Seguridad revisada

- `.env` real no esta versionado.
- `.next` no esta versionado.
- `node_modules` no esta versionado.
- `.npm-cache` no esta versionado.
- Solo se versionan `.env.example` y `.env.production.example`.
- Las credenciales demo son configurables por `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD`.

## Pendiente antes de produccion real

- Elegir hosting.
- Crear PostgreSQL online.
- Cargar variables de entorno reales.
- Correr migraciones con `npm run db:deploy`.
- Crear/admin real sin depender de seed demo.
- Cambiar contrasenas demo.
- Agregar recuperacion/cambio de contrasena.
- Integrar proveedor real de WhatsApp.
- Definir roles/permisos si habra mas de un admin por negocio.
- Probar `npm run smoke` contra la URL publica.

## Recomendacion al volver

1. Actualizar repo local con `git pull`.
2. Abrir Docker.
3. Activar Node 22.
4. Ejecutar `npm run doctor`.
5. Ejecutar `npm run dev`.
6. Ejecutar `npm run smoke`.
7. Elegir Railway o Render para publicar demo.

## Decision recomendada

No pagar hosting antes del viaje. Conviene publicar cuando vuelvas, con tiempo para mirar logs, errores y configuracion de dominio.
