# AMS Server

Express + Prisma backend API for the School Attendance Management System.

## Prerequisites

- PostgreSQL running locally or remotely
- `.env` file configured (copy `.env.example` and update credentials)

## Commands

```bash
# generate Prisma client
yarn prisma generate

# run database migrations
npx prisma migrate dev --name init

# start development server
npm run dev --workspace=server
```

## Database

The schema is defined in `prisma/schema.prisma`. Run `npx prisma studio` during development to explore data.
