# Generate Secure Streaming (Backend)

Express + TypeScript + Prisma backend to upload media and generate secure 10‑minute streaming links, with view logging, analytics, rate limiting, and optional Redis caching.

## Quick start

1. Node 18+ recommended.
2. Create `.env` from `.env.example` and adjust values.
3. Install deps:

```bash
npm ci
```

4. Prisma migrate and generate:

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Dev server:

```bash
npm run dev
```

Visit http://localhost:3000 for a minimal UI.

## Scripts
- `npm run dev` – Start dev server (ts-node + nodemon)
- `npm run build` – TypeScript build to `dist/`
- `npm start` – Run built server
- `npm test` – Run Jest tests
- `npm run prisma:migrate` – Apply migrations
- `npm run prisma:generate` – Generate Prisma client

## Environment
See `.env.example`:
- `DATABASE_URL` – SQLite by default
- `JWT_SECRET` – Secret for signing tokens
- `PORT` – Default 3000
- `UPLOAD_DIR` – Directory for uploads (served at `/static`)
- `REDIS_URL` – Optional, enables Redis cache for analytics

## Endpoints
- `POST /auth/signup`
- `POST /auth/login` → JWT
- `POST /media` (auth, multipart: `title`, `type`, `file`)
- `GET /media/:id/stream-url` (auth)
- `GET /media/stream?token=...`
- `POST /media/:id/view` (auth, rate-limited)
- `GET /media/:id/analytics` (auth, cached)
- `POST /resume/upload` (multipart: `resume`)

## Docker
Build and run:
```bash
docker build -t secure-streaming .
docker run --env-file .env -p 3000:3000 secure-streaming
```

## Tests
```bash
npm test
```

## Notes
- Caching: If `REDIS_URL` is set, analytics uses Redis; otherwise in-memory cache.
- Links are valid for 10 minutes and views are logged by IP.
