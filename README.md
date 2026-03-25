# Keepsey Backend API

[![Node.js][Node.js]][Node-url]
[![Express.js][Express.js]][Express-url]
[![TypeScript][TypeScript]][TypeScript-url]
[![PostgreSQL][PostgreSQL]][PostgreSQL-url]
[![Prisma][Prisma]][Prisma-url]

A secure REST API for personal and collaborative gift-list management.

[Explore the docs »](#about-the-project)

[Get Started](#getting-started) · [API Endpoints](#api-endpoints) · [Testing](#testing)

## Table of Contents

- [About The Project](#about-the-project)
  - [Key Features](#key-features)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema Overview](#database-schema-overview)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)

## About The Project

Keepsey is a backend service for managing categories, items, and shared lists where collaborators can claim gifts. It is designed for secure multi-user workflows with ownership boundaries, invite tokens, validation, and rate limiting.

### Key Features

- **JWT Authentication**: Signup/signin + protected routes.
- **Category Management**: User-scoped category CRUD with duplicate protection.
- **Item Management**: Manual item creation, URL metadata extraction, image upload/compression, filtering, update, and delete.
- **Shared Lists**: Owner-created shared lists with collaborator invite/accept flow.
- **Claim System**: Collaborators can claim items; owners have separate visibility behavior.
- **Validation Layer**: Route-level Zod validation for auth/list/item payloads.
- **Rate Limiting**: Throttling on auth endpoints and invite endpoints.
- **Centralized Error Handling**: Consistent API error payloads.

### Built With

- [![Node.js][Node.js]][Node-url]
- [![Express.js][Express.js]][Express-url]
- [![TypeScript][TypeScript]][TypeScript-url]
- [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
- [![Prisma][Prisma]][Prisma-url]
- [![Zod][Zod]][Zod-url]
- [![Jest][Jest]][Jest-url]

## Getting Started

### Prerequisites

- Node.js 20+ (project engines: `>=20 <23`)
- npm
- PostgreSQL instance

### Installation

1. Clone and open backend:

   ```sh
   git clone <your-repo-url>
   cd Backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create environment file:

   ```sh
   cp .env.example .env
   ```

4. Set your database values in `.env`.

5. Run migrations and generate client:

   ```sh
   npx prisma migrate dev
   npx prisma generate
   ```

6. Start the API:

   ```sh
   npm run dev
   ```

Default health endpoint: `GET /api/health`

### Environment Variables

Use `.env.example` as the source of truth.

Current required variables:

```env
PORT=3000

DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=keepsey
DB_PASSWORD=your_db_password
DB_PORT=5432
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/keepsey?schema=public"

JWT_SECRET="super-long-random-secret"
```

## API Endpoints

See the detailed endpoint table in [API.md](API.md).

High-level groups:

- `/api/auth`
- `/api/categories`
- `/api/items`
- `/api/lists`

## Database Schema Overview

Main entities:

- `User`
- `Category`
- `Item`
- `List`
- `ListCollaborator`
- `CollaboratorInvite`
- `Claim`

Enums include:

- `ClaimStatus`
- `CollaboratorRole`
- `CollaboratorInviteStatus`

Schema file: `prisma/schema.prisma`.

## Architecture

```text
src/
├── controllers/     # Route handlers (auth, category, item, list)
├── lib/             # Prisma client setup
├── middleware/      # Auth, validation, rate-limit, error handling
├── routes/          # Express route registration
├── validators/      # Zod schemas per route domain
└── index.ts         # App bootstrap
```

## Testing

Run unit tests:

```sh
npm test
```

Run type check:

```sh
npm run typecheck
```

Current tests cover critical flows:

- signup/signin
- invite + accept
- claim visibility (owner vs collaborator)

## Deployment Notes

- Set `NODE_ENV=production` and secure `JWT_SECRET`.
- Set production `DATABASE_URL`.
- Keep `.env` out of git (`.gitignore` already configured).
- On deploy, run:

```sh
npx prisma migrate deploy
```

[Back to top](#keepsey-backend-api)

[Node.js]: https://img.shields.io/badge/Node.js-20232A?style=for-the-badge&logo=node.js&logoColor=green
[Node-url]: https://nodejs.org/
[Express.js]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Prisma]: https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white
[Prisma-url]: https://www.prisma.io/
[Zod]: https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=typescript&logoColor=white
[Zod-url]: https://zod.dev/
[Jest]: https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white
[Jest-url]: https://jestjs.io/
