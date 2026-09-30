# Reservation SaaS (proyecto personal en desarrollo)

Sistema multi-tenant de reservas construido con Next.js, TypeScript, Prisma y PostgreSQL. Se ejecuta igual desde macOS y Windows, incluida la terminal integrada de VS Code.

## Requisitos

- Node.js 22. La version esta declarada en `.nvmrc` y `.node-version`.
- npm.
- Docker Desktop, para ejecutar PostgreSQL de forma identica en ambos sistemas.

## Inicio local

Abrir la terminal integrada de VS Code en la carpeta del proyecto y ejecutar:

```bash
npm ci
```

Si npm avisa que la version de Node es vieja, instalar/activar Node 22 antes de continuar. En macOS y Windows conviene usar la version declarada en `.nvmrc` / `.node-version`.

Crear `.env` desde el ejemplo:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Iniciar la base, aplicar el esquema y cargar datos demo:

```bash
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
```

Verificar que el entorno este listo:

```bash
npm run doctor
```

Iniciar la aplicacion:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Admin demo:

- URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Email: `dosdeabril@test.com`
- Password: `test1234`

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia la aplicacion en desarrollo. |
| `npm run clean` | Elimina archivos generados de Next, TypeScript y cobertura. |
| `npm run doctor` | Revisa Node, Docker, `.env`, dependencias y Prisma antes de levantar. |
| `npm run smoke` | Prueba el flujo cliente/admin: crea una reserva demo, valida admin y la cancela. |
| `npm run check` | Ejecuta lint y comprobacion de tipos. |
| `npm run build` | Genera una compilacion de produccion. |
| `npm run db:up` | Inicia PostgreSQL con Docker. |
| `npm run db:down` | Detiene PostgreSQL. |
| `npm run db:generate` | Genera Prisma Client. |
| `npm run db:migrate` | Aplica las migraciones locales. |
| `npm run db:seed` | Carga datos demo. |
| `npm run db:verify` | Verifica que el motor de disponibilidad responda. |

## Estructura

- `src/app`: pantallas y API de Next.js.
- `src/services`: reglas de negocio y disponibilidad.
- `src/contracts`: validacion de entradas.
- `prisma`: esquema, migraciones y datos demo.
- `public/brand`: imagenes usadas por la interfaz.

## Rutas principales

- `/booking`: flujo general de reservas.
- `/business/2-de-abril`: pagina publica demo.
- `/business/2-de-abril/dashboard`: panel interno demo.
- `/business/2-de-abril/premium`: modulo premium demo.

## Compatibilidad

No hay scripts que dependan de Bash, PowerShell o archivos `.bat`. Docker Compose mantiene la misma base PostgreSQL en macOS y Windows; `.gitattributes` normaliza los finales de linea y los archivos generados quedan fuera de Git.

## Retomar despues de varios dias

1. Abrir Docker Desktop.
2. Activar Node 22.
3. Ejecutar `npm ci` si cambian dependencias o `node_modules` no existe.
4. Ejecutar `npm run db:up`.
5. Ejecutar `npm run doctor`.
6. Ejecutar `npm run dev`.

Si aparece un error de archivos faltantes dentro de `.next`, correr:

```bash
npm run clean
npm run dev
```

Para validar el flujo completo con la app ya levantada:

```bash
npm run smoke
```

El smoke test usa por defecto `http://localhost:3001`, el negocio `2-de-abril` y el admin demo. Se puede cambiar con variables:

```bash
SMOKE_BASE_URL=http://localhost:3000 SMOKE_BUSINESS_SLUG=2-de-abril npm run smoke
```
