# Classroom Backend

REST API for the Classroom management application. Handles authentication, data access, and business logic for managing departments, subjects, classes, and enrollments.

## Tech Stack

            Tool  | Purpose

**Node.js + Express 5** | HTTP server and routing 
**TypeScript** | Type safety 
**PostgreSQL** | Primary database 
**Drizzle ORM** | Database queries and schema management 
**Better Auth** | Session-based authentication 
**Zod** | Request validation 
**Upstash Redis + Ratelimit** | Rate limiting 
**Helmet + HPP** | Security headers 
**Cloudinary** | Image storage (via frontend upload) 

## Project Structure

```
src/
├── db/
│   ├── schema/       # Drizzle table definitions
│   └── index.ts      # Database connection
├── routes/
│   ├── auth.ts       # Login, register, session
│   ├── classes.ts    # Class CRUD
│   ├── departments.ts # Department CRUD
│   ├── enrollments.ts # Enroll / join by invite code
│   ├── subjects.ts   # Subject CRUD
│   ├── users.ts      # User listing and related data
│   └── stats.ts      # Dashboard statistics
├── middleware/
│   └── rate-limit.ts
└── index.ts          # App entry point
```

## API Overview

| Resource    | Endpoints                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Auth        | `POST /api/auth/sign-in`, `POST /api/auth/sign-up`, `POST /api/auth/sign-out`                           |
| Departments | `GET/POST /api/departments`, `GET /api/departments/:id`                                                 |
| Subjects    | `GET/POST /api/subjects`, `GET /api/subjects/:id`                                                       |
| Classes     | `GET/POST /api/classes`, `GET /api/classes/:id`                                                         |
| Enrollments | `POST /api/enrollments`, `POST /api/enrollments/join`                                                   |
| Users       | `GET /api/users`, `GET /api/users/:id`, `GET /api/users/:id/departments`, `GET /api/users/:id/subjects` |
| Stats       | `GET /api/stats/overview`, `GET /api/stats/latest`, `GET /api/stats/charts`                             |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables


# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/classroom
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:8000
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
