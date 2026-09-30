# Deploy de Reservation SaaS

Esta guia deja el proyecto listo para publicar en Railway, Render, un VPS o cualquier hosting que ejecute Next.js con Node y PostgreSQL.

## Requisitos de produccion

- Node.js 22 o al menos Node 20.19.
- PostgreSQL administrado o instalado en el servidor.
- Variables de entorno cargadas desde `.env.production.example`.
- Migraciones Prisma aplicadas con `npm run db:deploy`.
- Build de Next.js creado con `npm run build`.

## Variables de entorno

Crear las variables en el panel del hosting. No subir secretos reales al repositorio.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexion PostgreSQL de produccion. |
| `NEXT_PUBLIC_APP_URL` | URL publica de la app. |
| `DEMO_ADMIN_EMAIL` | Email demo/admin inicial, si se usa seed o reset demo. |
| `DEMO_ADMIN_PASSWORD` | Password demo/admin inicial. Cambiar siempre fuera del entorno local. |

Para proveedores externos de PostgreSQL suele hacer falta `sslmode=require` al final de `DATABASE_URL`.

## Comandos de deploy

Instalacion:

```bash
npm ci
```

Generar Prisma Client:

```bash
npm run db:generate
```

Aplicar migraciones en produccion:

```bash
npm run db:deploy
```

Compilar:

```bash
npm run build
```

Iniciar:

```bash
npm run start
```

## Railway o Render

Configuracion recomendada:

- Build command: `npm ci && npm run db:generate && npm run build`
- Start command: `npm run start`
- Predeploy/Release command, si la plataforma lo permite: `npm run db:deploy`
- Node version: `22`

Si la plataforma no tiene comando de release separado, ejecutar `npm run db:deploy` manualmente desde la consola del servicio antes del primer arranque o despues de cada cambio de schema.

## VPS

Flujo recomendado:

```bash
git pull
npm ci
npm run db:generate
npm run db:deploy
npm run build
npm run start
```

En VPS real conviene usar un process manager como PM2 o un servicio systemd para mantener la app encendida.

## Seed y datos demo

`npm run db:seed` carga datos demo. Usa `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD` para la cuenta del complejo 2 de Abril. Usarlo solo en entornos de prueba o demo controlada.

En produccion real:

1. Crear el negocio real.
2. Crear un admin real.
3. Cambiar cualquier password demo.
4. No usar `test1234`.

## Checklist antes de publicar

- [ ] `DATABASE_URL` apunta a una base PostgreSQL real.
- [ ] La base tiene backup o snapshots.
- [ ] `npm run db:deploy` corre sin errores.
- [ ] `npm run build` corre sin errores.
- [ ] El login admin usa credenciales reales.
- [ ] `.env` y secretos no estan versionados en Git.
- [ ] `npm run smoke` pasa contra la URL publicada.
- [ ] El dominio final usa HTTPS.

## Smoke test publicado

Con la app publicada:

```bash
SMOKE_BASE_URL=https://tu-dominio.com npm run smoke
```

El test crea una reserva demo, verifica que aparezca en admin y luego la cancela.
