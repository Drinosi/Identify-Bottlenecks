# Identify Bottlenecks

Next.js app with Better Auth and Postgres

## Local Development

Create a local env file:

```bash
cp .env.example .env
```

Start Postgres:

```bash
docker compose up postgres
```

For a fresh database, Postgres runs SQL files from `db/migrations` on the first
volume initialization. If the `postgres_data` volume already exists, apply new
migrations manually or recreate the volume.

In another terminal, run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

Build and run the full stack:

```bash
docker compose up --build
```

The app is available at [http://localhost:3000](http://localhost:3000), and
Postgres is exposed on `localhost:5432`.

## Checks

```bash
npm run lint
npm run build
```
