# AMS – School Attendance Management System

This monorepo hosts a full-stack School Attendance Management Dashboard with an admin and teacher experience. The frontend is built with React (Vite + TypeScript + Tailwind CSS) and the backend uses Express, TypeScript, Prisma, and PostgreSQL.

## Project Structure

```
.
├── client/        # Vite React frontend
├── server/        # Express API backend
├── package.json   # npm workspaces root configuration
└── README.md
```

## Requirements

- Node.js 18.18+
- npm 9+
- PostgreSQL 14+

## Getting Started

```bash
# install dependencies for both workspaces
npm install

# run frontend and backend in parallel (in separate terminals)
npm run dev --workspace=client
npm run dev --workspace=server
```

See the `client/README.md` and `server/README.md` for detailed instructions.
