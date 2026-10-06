# Secure Ledger

## Run with Docker

Install Docker Desktop with Docker Compose, then copy `.env.example` to `.env`.
Set `POSTGRES_PASSWORD` to a long URL-safe password and `JWT_SECRET` to a
different, long random secret. Both are required; Compose refuses to start with
missing values. Keep `.env` private; it is ignored by Git.

From the repository root, build and start the complete stack:

```sh
docker compose up --build -d
```

The backend waits for PostgreSQL to become healthy, applies all pending Prisma
migrations, and then starts the API. The frontend is served through Nginx, which
proxies `/api` requests to the backend.

- Frontend: <http://localhost:8080>
- Backend health endpoint: <http://localhost:3000/>
- PostgreSQL: `localhost:5432` (only exposed on the local machine)

Check service health and logs:

```sh
docker compose ps
docker compose logs -f backend db
```

Optional email configuration and system-account seed variables are documented
in `.env.example`. For a custom frontend origin, provide a comma-separated
`CLIENT_ORIGINS`; leave `VITE_API_URL` empty to use the Nginx `/api` proxy. To
seed the system account after setting those variables and recreating the backend:

```sh
docker compose up -d --build backend
docker compose exec backend npm run db:seed:system
```

Stop the containers while keeping the database volume:

```sh
docker compose down
```

The database is stored in the named `postgres-data` volume and persists across
container restarts. `docker compose down -v` also deletes that volume and all
data stored in it.
