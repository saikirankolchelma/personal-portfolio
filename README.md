# Personal AI Engineer Portfolio & Workspace

A portfolio and personal AI workspace for **Kolchelma Sai Kiran** — AI/ML Engineer.

Two halves of one application:

- **Public portfolio** — profile, experience, project breakdowns, AI Lab, freelance services and inquiry intake, plus a small games-and-tools section.
- **Private workspace** (in progress) — task management, work journal, a Gemini assistant over that history, and task capture from phone messages.

---

## Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19        |
| Language   | TypeScript (strict)                                  |
| Styling    | Tailwind CSS v4, CSS-variable design tokens          |
| Animation  | Framer Motion, CSS keyframes                         |
| Database   | PostgreSQL (Neon / Vercel Postgres) via Prisma 7     |
| Auth       | NextAuth credentials, single owner account (planned) |
| AI         | Google Gemini, server-side only (planned)            |
| Messaging  | Telegram Bot API webhook (planned)                   |
| Deployment | Vercel                                               |

---

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in what you have; see below
npm run dev
```

The site runs at <http://localhost:3000>.

**Nothing in `.env.local` is required to run the public portfolio.** Every public page is statically rendered from the content layer. Features degrade explicitly rather than silently:

| Missing variable  | Effect                                                                          |
| ----------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Inquiry form returns a clear "not connected yet" message with the email fallback |
| `GEMINI_API_KEY`  | Chatbot and voice agent unavailable (not yet built)                             |
| `TELEGRAM_*`      | Message-to-task ingestion unavailable (not yet built)                           |

### Database setup

Prisma 7 reads connection strings from `prisma.config.ts`, not from `schema.prisma`.

```bash
# after setting DATABASE_URL in .env.local
npm run db:generate     # generate the client
npm run db:push         # push the schema (development)
npm run db:migrate      # or create a migration
npm run db:studio       # browse the data
```

---

## Scripts

| Script               | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Development server                              |
| `npm run build`      | Production build                                |
| `npm run typecheck`  | Route typegen + `tsc --noEmit`                   |
| `npm run lint`       | ESLint, zero warnings tolerated                 |
| `npm run check`      | Typecheck, lint and build — run before deploying |

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                 Home
│  ├─ about/                   Career journey, skills, education
│  ├─ experience/              Professional timeline
│  ├─ projects/                Index + per-project breakdowns
│  ├─ ai-lab/                  Interest and learning areas
│  ├─ freelance/               Services + inquiry form
│  ├─ contact/                 Contact channels
│  ├─ play/                    Games and productivity tools
│  ├─ api/inquiries/           Freelance inquiry intake
│  ├─ sitemap.ts, robots.ts    SEO
│  └─ globals.css              Design tokens
├─ components/
│  ├─ layout/                  Header, footer, theme toggle
│  ├─ ui/                      Primitives (Card, Button, Badge, …)
│  ├─ sections/                Page sections, project cards, forms
│  ├─ games/  tools/           Play section
├─ content/                    ← all site copy and facts live here
└─ lib/                        db, validation, rate limiting, hooks
```

### The content layer

`src/content/` is the single source of truth for every fact on the site. Pages
read from it; nothing is hardcoded in JSX.

| File            | Holds                                              |
| --------------- | -------------------------------------------------- |
| `profile.ts`    | Name, title, links, summary, education, certs      |
| `experience.ts` | Roles, workstreams, responsibilities               |
| `projects.ts`   | Project breakdowns (problem → architecture → results) |
| `skills.ts`     | Technical skill groups                             |
| `ai-lab.ts`     | Interest areas, labeled by depth of engagement     |
| `freelance.ts`  | Services, availability, inquiry form options       |
| `about.ts`      | Career narrative, goals                            |
| `play.ts`       | Games and tools registry                           |

**Editing rule.** Everything factual traces back to the resume
(`Kolchelma_Sai_Kiran_AI_ML_Engineer_Resume (1).pdf`, 12 Sep 2026). When adding
content:

- Client and employer work stays at the level of detail already published on the
  resume. No proprietary architecture, data or client specifics.
- `results` arrays hold only verified figures. Leave empty rather than estimate —
  the UI hides the section when there is nothing to show.
- `repo` and `demo` stay `null` unless a real URL exists.
- AI Lab areas are labeled `applied` / `hands-on` / `exploring`. Label honestly;
  the legend is published on the page.

### Things left for you to fill in

- `src/content/about.ts` → `personalInterests` is deliberately empty. The About
  page hides the section until you add your own. Nothing was invented.
- `projects.ts` → `repo` / `demo` URLs, if you want the Meta-RAG source linked.

---

## Build status

Current state — Phase 1 complete:

- ✅ Public portfolio, fully responsive, dark and light themes
- ✅ Project detail pages, statically pre-rendered
- ✅ Freelance inquiry API with validation, honeypot and rate limiting
- ✅ Database schema for all planned phases
- ✅ SEO: metadata, sitemap, robots, canonical URLs
- ✅ Games and tools (Tic-Tac-Toe, Snake, Pomodoro)
- ⬜ Private dashboard and auth
- ⬜ Gemini chatbot and voice agent
- ⬜ Telegram message → task ingestion

---

## Security notes

- The Gemini key, database URL and Telegram token are server-side only. No secret
  is ever read from a `NEXT_PUBLIC_*` variable.
- `/dashboard` and `/api/` are excluded from `robots.txt`.
- Submitter IPs are salted-hashed before storage, never stored raw.
- The phone number in `profile.ts` is intentionally **not** rendered on any public
  page.
- Private work data (tasks, journal, notes) is separated from public content at
  both the route and database level. The public chatbot will have no path to it.

---

## Deployment

Deploys to Vercel from GitHub. Set every variable from `.env.example` in the
Vercel project settings, then:

```bash
npm run check    # typecheck + lint + build must all pass
```
