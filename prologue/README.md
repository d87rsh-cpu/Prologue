# Prologue

Full-stack web application.

## Tech stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router v6
- **Backend:** Node.js, Express
- **Database:** Supabase (JS client)

## Setup

1. Copy `.env` and fill in your Supabase and Gemini API keys.
2. From project root: `npm install` then `npm run dev`.

## Scripts

- `npm run dev` — run client (port 5173) and server (port 3001) together
- `npm run dev:client` — client only
- `npm run dev:server` — server only

## Structure

- `client/` — React frontend (Vite)
- `server/` — Express API
