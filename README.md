# MesaLista

Full-stack reservation and menu system for a restaurant: customers browse the menu and book a table; the owner manages the day's reservations from a protected admin panel.

**Live demo:** [mesalista.vercel.app](https://mesalista.vercel.app) · **API:** [mesalista-76s8.onrender.com/api/menu](https://mesalista-76s8.onrender.com/api/menu)

> ⏱ The API runs on Render's free tier and sleeps after inactivity — the first request can take ~50 s to wake it.

> 📸 _Screenshot pending._

## Stack

| Layer | Tech | Why |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 | Typed components, instant dev feedback, utility-first styling without a config file |
| Backend | Node.js, Express 5, TypeScript | Express 5 forwards async errors natively — no wrapper boilerplate |
| Database | PostgreSQL (Supabase) + Prisma 7 | Typed queries generated from one schema file; migrations as reviewable SQL |
| Validation | Zod | One schema validates and types each endpoint's input; the form renders the field errors it returns |
| Auth | JWT + bcryptjs | Stateless sessions for a single-admin panel |

## Technical decisions

- **Real availability, race-safe.** Booking finds the *smallest* free table that fits the party (a couple never takes the 6-seater) and runs check + insert in one `Serializable` transaction — two requests racing for the last table can't double-book; the losing transaction retries once against the new state. A full slot answers `409` with a message the form shows under the time field.
- **Prisma 7 with driver adapters.** CLI config in `prisma.config.ts`, client generated as TypeScript into `src/generated/`, connecting through the standard `pg` driver. Migrations use Supabase's direct connection; the app runs through the transaction pooler.
- **The server is the only validator.** The client does cheap UX guards (required fields, date minimums, selects that only offer valid values), but every rule lives in Zod on the server, and 400/409 responses carry per-field messages the form renders directly.
- **Admin panel protected by JWT.** bcrypt-hashed credentials, identical 401s for wrong email vs wrong password (no user enumeration), 12-hour tokens, and route-level `requireAuth` middleware — the client's route guard is UX, not security.

## Run it locally

Requires Node 20+ and a PostgreSQL database (free tier of [Supabase](https://supabase.com) or [Neon](https://neon.tech)).

```bash
# 1. API
cd server
npm install
cp .env.example .env   # fill in database URLs, JWT secret and admin credentials
npx prisma migrate dev # create the tables
npx prisma db seed     # menu data, tables and the admin user
npm run dev            # http://localhost:3001

# 2. Frontend (second terminal)
cd client
npm install
npm run dev            # http://localhost:5173
```

Admin panel at `/admin` — log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `server/.env`.

## What I'd improve with more time

- **Tests.** Vitest + Supertest on the three things that earn it: the availability logic's edge cases, reservation input validation, and the auth middleware.
- **Confirmation emails** when the owner confirms a booking (Resend).
- **Weekly view** in the admin panel; today it's day-by-day.
- **A shared types package.** Client types and time slots are hand-mirrored from the server — fine at this size, but the next feature that touches both sides pays for `npm workspaces`.
- **Dish photos** and a visual design pass.
- Known advisory: `npm audit` flags `@prisma/dev` (a dependency of the Prisma CLI's local-dev database server, `prisma dev`) — tooling we don't use; the deployed runtime is unaffected. Tracked until a patched CLI release.
