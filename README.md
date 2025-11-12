# AMS – School Attendance Management System

This monorepo hosts a full-stack School Attendance Management Dashboard with an admin and teacher experience. The frontend is built with React (Vite + TypeScript + Tailwind CSS) and the backend uses Express, TypeScript, Prisma, and SQLite (through Prisma).

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
- PowerShell (pwsh) for the optional helper script (`start.bat`)

## Getting Started

```bash
# install dependencies for both workspaces
npm install

# generate .env from template (done automatically by start.bat, otherwise copy manually)
copy server\.env.example server\.env  # Windows
cp server/.env.example server/.env      # macOS/Linux

# start API and client together
npm run dev

# or start them individually
npm run dev:server
npm run dev:client
```

> ℹ️ First-time setup: after the dependencies finish installing, the SQLite database lives at `server/prisma/dev.db`. Run `npm run migrate --workspace server` (if you introduce new schema changes) and `npm run seed --workspace server` to load the default accounts and sample data.

### One-click startup (Windows)

Run `start.bat` from the repository root. It checks that Node/npm/Pwsh are available, installs dependencies if needed, generates `server/.env` from the template, launches both dev servers in separate terminals, and opens the frontend in your browser. The script finishes with a quick health check against `http://localhost:4000/health` so you know the API is reachable.

See the `client/README.md` and `server/README.md` for detailed instructions.
