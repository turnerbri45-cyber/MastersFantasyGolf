# Fantasy Golf — Masters 2026: Setup Guide

## Prerequisites

1. **Install Node.js 18+** — https://nodejs.org (download the LTS version)
2. **Install dependencies**:
   ```bash
   cd fantasy-golf-masters
   npm install
   ```

## Local Development

### 1. Configure environment variables

Edit `.env.local` — the defaults work for local dev, but you need a real `NEXTAUTH_SECRET`:

```bash
# Generate a strong secret:
openssl rand -base64 32
```

Replace `replace-with-strong-random-secret` with the output.

### 2. Set up the database

```bash
# Create the SQLite database and run migrations
npx prisma migrate dev --name init

# (Optional) Seed with demo users and a test league
npm run db:seed
```

Demo accounts after seeding:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- League invite code: `DEMO1234`

### 3. Load the Masters field

Start the dev server first, then trigger a score sync in your browser:

```bash
npm run dev
# Then visit: http://localhost:3000/api/scores/refresh
```

This fetches the live Masters field from ESPN and populates the golfer database.
During the tournament it will also pull live scores.

### 4. Start the app

```bash
npm run dev
# Visit: http://localhost:3000
```

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create fantasy-golf-masters --public --push
```

### 2. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo at vercel.com.

### 3. Set environment variables in Vercel

In your Vercel project dashboard → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Postgres connection string (see below) |
| `NEXTAUTH_SECRET` | Strong random string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `ROUND3_LOCK_DEADLINE` | `2026-04-11T10:00:00-04:00` |
| `CRON_SECRET` | Strong random string |

### 4. Set up a PostgreSQL database

**Option A: Vercel Postgres** (simplest)
- Vercel Dashboard → Storage → Create Database → Postgres
- Copy the `DATABASE_URL` connection string

**Option B: Supabase** (free tier)
- Create project at supabase.com
- Copy the Postgres connection string

Once you have the connection string, update `prisma/schema.prisma`:

```diff
datasource db {
-  provider = "sqlite"
-  url      = env("DATABASE_URL")
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
}
```

Then run migrations:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 5. Verify cron jobs

After deploying, Vercel will automatically schedule:
- `/api/scores/refresh` — every 5 min during tournament days (April 9–12)
- `/api/lock/autoselect-all` — once at 10 AM ET on Saturday April 11

You can verify in Vercel Dashboard → Cron Jobs.

---

## Scoring Rules

- Each user picks **8 golfers** during the draft
- Before Round 3 (deadline: Saturday 10 AM ET), select your **final 6**
- If you miss the deadline, your **best 6 by R1+R2 score** are auto-selected
- **Scoring**: sum of all 6 golfers' strokes to par, minus position bonuses
  - 1st place: −50 pts
  - 2nd place: −40 pts
  - 3rd place: −30 pts
  - 4th place: −20 pts
  - 5th place: −10 pts
- **Lower score = better** (same as real golf)
- Missed-cut golfers: R1+R2 only, no bonus

---

## Project Structure

```
src/
├── app/                   # Next.js App Router pages + API routes
├── components/            # React components
│   └── layout/            # Navbar, AuthProvider
├── lib/                   # Core business logic
│   ├── auth.ts            # NextAuth config
│   ├── espn.ts            # ESPN API integration
│   ├── lock.ts            # Round 3 lock logic + auto-select
│   ├── scoring.ts         # Fantasy score calculation
│   └── invite.ts          # Invite code generation
├── hooks/                 # SWR data hooks
└── types/                 # TypeScript type declarations
prisma/
└── schema.prisma          # Database models
```
