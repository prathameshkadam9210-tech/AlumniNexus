# Vercel with PostgreSQL

Local development continues to use SQLite through `DATABASE_URL` in `.env`.
Vercel builds generate the PostgreSQL Prisma Client from
`prisma/schema.postgresql.prisma` and read the connection string from
`ALUMNINEX_DATABASE_URL`. Keep the connection string in Vercel environment
settings; do not commit it or replace the local SQLite URL.

## Initial database setup

1. In Vercel Project Settings, enable access to system environment variables.
   The build uses Vercel's `VERCEL=1` value to select the PostgreSQL Prisma
   schema; local installs continue to select SQLite.
2. Set `ALUMNINEX_DATABASE_URL` to the PostgreSQL connection string for the
   Production environment. If you use Preview deployments, configure this
   variable there too, preferably with a separate preview database.
3. Link the local project to the Vercel project:

   ```powershell
   npx vercel link
   ```

4. Apply the Prisma schema to the new, empty production database:

   ```powershell
   npx vercel env run -e production -- npm run db:push:postgres
   ```

   This command does not use `--accept-data-loss`. Do not run it against a
   database with data you need to preserve without first reviewing and backing
   up that database.
5. Redeploy and test registration and login. If a request still fails, inspect
   that deployment's Vercel Function logs.

`prisma db push` creates the initial tables but does not copy data from the
local SQLite database. Local Prisma generation and the local database remain
SQLite-based.
