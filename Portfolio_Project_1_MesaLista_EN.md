# Portfolio Project #1 — "MesaLista" (or whatever name you prefer)

**Goal:** a real, deployed full-stack project that makes your CV claims true (React + Node) and serves as your counterweight to "minimum 2 years of experience." This is not a todo app: it's a product from your world (hospitality) that you can explain with authority in an interview.

---

## What it is

**A reservation + menu system for a restaurant.** A customer views the menu and books a table; the owner manages reservations from an admin panel. It's the natural evolution of your QR-menu product — same domain, but now with state, an API and a database, which is exactly what a junior full-stack role evaluates.

## Stack (chosen to match the listings you're applying to)

- **Frontend:** React 18 + TypeScript + Tailwind CSS (Vite as bundler)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (use Neon or Supabase, free tier) — requested in many listings and already on your CV
- **Deployment:** frontend on Vercel, API on Render or Railway (free tiers)
- **Extras that score points:** validation with Zod, ORM with Prisma (in high demand and easy to learn)

## MVP — minimum features (you finish this NO MATTER WHAT)

1. **Public menu** — page listing dishes by category, data served from the API (GET /api/menu). Responsive, mobile-first (your strength).
2. **Reservation form** — date, time, party size, name, phone. Validation on client AND server. POST /api/reservations.
3. **Real availability logic** — the restaurant has X tables; you can't book a full slot. *This is the part that makes you stand out: it's business logic, not just CRUD.*
4. **Admin panel** — protected route with simple login (JWT). List of today's reservations, confirm/cancel.
5. **Decent UI states** — loading, error, success. Juniors who handle this well stand out.

## Stretch goals (only once the MVP is deployed and polished)

- Reservation confirmation email (Resend — you already know it)
- Weekly view in the admin panel
- Basic API tests with Vitest/Jest (mentioning testing in an interview is gold)
- i18n ES/EN (fits your multilingual story)

## Repo structure

```
mesalista/
├── client/          # React + Vite + TS + Tailwind
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── api/     # fetch wrappers
├── server/          # Express + TS
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/  # auth, validation
│       └── db/          # Prisma schema + client
└── README.md
```

## README (this matters as much as the code)

Mandatory structure:
1. **One sentence** on what it is + **link to the live deploy** at the very top
2. **Screenshot or GIF** of the app working
3. Stack used and why
4. **Technical decisions** (3–4 bullets): why Prisma, how you solved table availability, how you protected the admin panel. *This is what a technical reviewer actually reads.*
5. How to run it locally
6. What you'd improve with more time (honesty = credibility)

## Work plan (realistic around your shifts)

- **Days 1–2:** monorepo setup, Prisma schema, menu API + data seed
- **Days 3–4:** menu frontend + connected reservation form
- **Days 5–6:** availability logic + admin panel with JWT
- **Day 7:** deploy, README, UI-state polish
- Total: **1–2 weeks** at your real pace. Deployed and imperfect > perfect on localhost.

## Honesty rule (important for interviews)

Build it with Claude Code if you want — that's real workflow — but with one rule: **don't let a single line in that you can't explain.** In the interview they'll ask "why did you do X this way?" about YOUR repo. "AI-assisted development" on your CV is a strength in 2026; not understanding your own code is disqualifying. After each session, read the diffs and ask Claude Code why it did what it did until you can defend it yourself.

## How you present it on the CV (once deployed)

> **MesaLista — full-stack reservation system** · [live-deploy-link] · [github]
> Reservation and menu app for restaurants: React/TypeScript, Node/Express API, PostgreSQL with Prisma, JWT authentication and table-availability logic. Deployed to production.

That's a project entry a junior full-stack reviewer takes seriously.
