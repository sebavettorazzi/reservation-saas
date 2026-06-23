# Reservation SaaS (proyecto personal en desarrollo)

SaaS multi-tenant de reservas construido con Next.js, TypeScript, Prisma y PostgreSQL.

## Requisitos en macOS

- Node.js `20.19+` o `22+`. El proyecto incluye `.nvmrc` con Node `22`.
- npm
- Docker Desktop o PostgreSQL local

Si usas `nvm`:

```bash
nvm install
nvm use
```

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

3. Editar `DATABASE_URL` en `.env` con tu conexion PostgreSQL.

Si usas Docker Desktop, levantar PostgreSQL con:

```bash
npm run db:up
```

Si usas PostgreSQL instalado localmente, asegurate de que el servicio este corriendo y que exista la base:

```bash
createdb reservation_saas
```

4. Generar Prisma Client y aplicar migraciones:

```bash
npm run db:generate
npm run db:migrate
```

5. Cargar datos demo:

```bash
npm run db:seed
```

6. Levantar la app:

```bash
npm run dev
```

En macOS, si aparece `EMFILE: too many open files`, usar:

```bash
npm run dev:mac
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos utiles

```bash
npm run dev
npm run dev:mac
npm run build
npm run lint
npm run db:up
npm run db:down
npm run db:generate
npm run db:migrate
npm run db:seed
npm run test:availability
```

## Notas Windows/macOS

- `run-prisma-test.bat` queda solo para Windows.
- En macOS puedes usar `bash run-prisma-test.sh`.
- La carpeta `.next` es generada por Next.js y no deberia versionarse.
- npm usa una cache local en `.npm-cache` para evitar errores de permisos con `~/.npm`.

## Troubleshooting macOS

Si `npm install` falla con un mensaje de Prisma sobre Node, actualiza Node primero:

```bash
# opcion recomendada si instalas nvm
nvm install 22
nvm use 22
```

Si npm falla por permisos en la cache global, este proyecto ya usa `.npm-cache`.
Tambien puedes reparar la cache global con:

```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
```

Si Docker Desktop esta instalado pero no abre por cuarentena de macOS:

```bash
sudo xattr -dr com.apple.quarantine /Applications/Docker.app
open /Applications/Docker.app
```

## Rutas principales

- `/booking`: flujo general de reservas.
- `/business/2-de-abril`: pagina publica demo.
- `/business/2-de-abril/dashboard`: panel interno demo.
- `/business/2-de-abril/premium`: modulo premium demo.
