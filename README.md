# Teskilat-i Mahsusa

Social network analysis and intelligence system. Tracks people, organizations, events, and their relationships with network graph visualization.

## Basic Explanation Video

https://github.com/user-attachments/assets/a1be73ef-aeee-437a-a1b4-e1c082f99a2f

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your passwords (defaults work for local dev)

# 3. Start PostgreSQL and MinIO
npm run docker:up

# 4. Run database migrations
npm run db:generate
npm run db:migrate

# 5. (Optional) Seed sample data
npm run db:seed

# 6. Start dev server
npm run dev
```

Open http://localhost:3000

MinIO console available at http://localhost:9001

## Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

The app will be available at http://localhost:3000.

> **Note:** Docker services (PostgreSQL + MinIO) must be running before starting the production server.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed sample data |
| `npm run test` | Run unit tests |

## License

MIT

## Note

This is a **proof of concept (POC)**. The project needs significant updates and improvements before it is production-ready. The primary goal at this stage is to gauge interest and attention — if there is demand, development will continue and expand.
