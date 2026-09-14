# Deployment runbook

Three accounts to set up, in this order. Each step says what to click, what to
copy, and how to check it worked before moving on.

Total time: roughly 40 minutes, most of it waiting for a first deploy.

---

## Before you start

Rotate your Gemini API key. The current one was pasted into a chat transcript,
so treat it as exposed.

1. Go to <https://aistudio.google.com/apikey>
2. Delete the old key, create a new one
3. Put the new value in `.env.local` as `GEMINI_API_KEY`

---

## Status

| Stage | State |
| --- | --- |
| Neon database | **Done** — tables created, account seeded, login verified |
| Gemini | **Done** — answering, though the key still needs rotating |
| Telegram bot | Token stored and verified as `@saikiran_assitant_bot`. Needs your numeric user id, and a live URL for the webhook. |
| GitHub | Needs you — no `gh` CLI on this machine, so the repo and push are yours to run |
| Vercel | Needs you — after GitHub |

Steps marked Done below are kept for reference and for rebuilding from scratch.

---

## 1 — Database (Neon) — DONE

Neon's free tier is enough for this. Vercel Postgres works identically if you
prefer it — the connection string is the only thing that differs.

### Create it

1. Sign up at <https://neon.tech> (GitHub login is fine)
2. **Create project** → name it `personal-p`, region closest to you
   (`Asia Pacific (Singapore)` for Hyderabad)
3. On the dashboard, find **Connection string**
4. Select **Pooled connection** from the dropdown — not the direct one
5. Copy the whole string, then change `sslmode=require` to `sslmode=verify-full`:
   ```
   postgresql://user:password@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require
   ```
   `node-postgres` now warns that `require` is being treated as `verify-full`
   anyway. Neon presents a valid certificate chain, so being explicit is both
   stricter and quieter.

### Wire it up locally

Open `.env.local` and set these four:

```bash
DATABASE_URL="<the pooled string you just copied>"
OWNER_EMAIL="Ksaikiran129@gmail.com"
OWNER_PASSWORD="<pick something 12+ characters>"
AUTH_SECRET="<already generated for you — leave it>"
```

`OWNER_PASSWORD` is your dashboard login. The seed script refuses anything
under 12 characters, because it is the only account on the system.

To read the generated one without printing it into a shell transcript:

```bash
grep OWNER_PASSWORD .env.local
```

To change it: edit that line, then re-run `npm run db:seed`. Re-seeding
rotates the password rather than creating a second account.

### Create the tables

```bash
npm run db:push     # creates every table from prisma/schema.prisma
npm run db:seed     # creates your account + three starter projects
```

Expected output from the seed:

```
Owner account ready: ksaikiran129@gmail.com
Starter projects ready.
```

### Check it worked

```bash
npm run dev
```

Go to <http://localhost:3000/login>, sign in with `OWNER_EMAIL` and
`OWNER_PASSWORD`. You should land on the dashboard with empty task lists
rather than the orange "Database not connected" panel.

Add one task to confirm writes work.

> **If `db:push` fails with a TLS or connection error**, your string is
> probably the direct connection rather than the pooled one. Go back and pick
> **Pooled connection** in the Neon dropdown.

---

## 2 — Hosting (Vercel)

### Push to GitHub first

The repo is already initialised and committed locally. It needs a remote.

1. Create a new **private** repo at <https://github.com/new> — name it
   `personal-p`. Do not add a README, licence or `.gitignore`; the repo
   already has them.
2. Then, in the project folder:

```bash
git remote add origin https://github.com/saikirankolchelma/personal-p.git
git branch -M main
git push -u origin main
```

`.env.local` is gitignored, so no secret goes up. Verify with
`git status --porcelain` — it should not list `.env.local`.

### Import into Vercel

1. Sign up at <https://vercel.com> with your GitHub account
2. **Add New → Project** → select `personal-p` → **Import**
3. Leave the framework preset as **Next.js** and do not change the build
   command. `prisma generate` runs automatically via `postinstall`.
4. Before clicking Deploy, expand **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the same Neon pooled string |
| `AUTH_SECRET` | the value from your `.env.local` |
| `OWNER_EMAIL` | your email |
| `OWNER_PASSWORD` | your password |
| `GEMINI_API_KEY` | your rotated key |
| `GEMINI_MODEL` | `gemini-3.6-flash` |
| `IP_HASH_SALT` | the value from your `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | leave this out for now — see below |

5. **Deploy**. First build takes two to four minutes.

### Set the site URL

Vercel only tells you the domain after the first deploy.

1. Copy your deployed URL, e.g. `https://personal-p.vercel.app`
2. **Settings → Environment Variables → Add**
   `NEXT_PUBLIC_SITE_URL` = that URL, no trailing slash
3. **Deployments → ⋯ on the latest → Redeploy**

This is what canonical links, the sitemap and OG tags use, so it matters for
SEO even though the site works without it.

### Check it worked

- Homepage loads and the theme toggle works
- `/login` accepts your credentials and reaches the dashboard
- The chat widget answers "What does Sai Kiran do?"
- `/sitemap.xml` shows your real domain, not `localhost`

---

## 3 — Telegram bot

Do this **after** Vercel, because the webhook needs your live HTTPS URL.
Telegram will not accept `localhost`.

### Create the bot

1. Open Telegram, message **[@BotFather](https://t.me/botfather)**
2. Send `/newbot`
3. Choose a display name, e.g. `Sai Kiran Work Journal`
4. Choose a username ending in `bot`, e.g. `saikiran_worklog_bot`
5. BotFather replies with a token like `8123456789:AAH...`. Copy it.

### Find your numeric user id

1. Message **[@userinfobot](https://t.me/userinfobot)**
2. It replies with your `Id`, a number like `1234567890`. Copy it.

This is the only account that will be allowed to create tasks.

### Generate a webhook secret

```bash
openssl rand -hex 24
```

### Add all three to both places

In `.env.local` **and** in Vercel's environment variables:

```bash
TELEGRAM_BOT_TOKEN="<from BotFather>"
TELEGRAM_ALLOWED_USER_ID="<your numeric id>"
TELEGRAM_WEBHOOK_SECRET="<the openssl output>"
```

Then re-link your account and redeploy:

```bash
npm run db:seed     # links your Telegram id to your account
```

Redeploy on Vercel so it picks up the new variables.

### Register the webhook

Make sure `NEXT_PUBLIC_SITE_URL` in `.env.local` is your **live HTTPS URL**,
not localhost — the script reads it from there.

```bash
npm run telegram:setup
```

Expected:

```
Webhook registered: https://your-app.vercel.app/api/telegram/webhook
Bot: @your_bot_name
Only Telegram user id 1234567890 may create tasks.
```

### Check it worked

Message your bot:

```
/help
```

You should get the command list. Then send a real update:

```
Finished the guardrail node implementation today. Need to test the workflow tomorrow.
```

It should reply with a structured task, and that task should appear at
`/dashboard/tasks` with a **via message** badge.

Useful commands: `/today`, `/pending`, `/week`, `/done <text>`.

> **Troubleshooting:** `npm run telegram:setup -- info` shows what Telegram
> currently has registered, including `last_error_message` if deliveries are
> failing. `npm run telegram:setup -- delete` unregisters.

---

## Optional — custom domain

1. Vercel → **Settings → Domains → Add**
2. Enter your domain and follow the DNS records it shows
3. Update `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy
4. Re-run `npm run telegram:setup` so the webhook points at the new host

---

## Final checklist

- [ ] Gemini key rotated after being pasted in chat
- [ ] `npm run db:push` and `npm run db:seed` both succeeded
- [ ] Local sign-in at `/login` works
- [ ] GitHub repo is **private** and `.env.local` is not in it
- [ ] Vercel build green, all env vars set
- [ ] `NEXT_PUBLIC_SITE_URL` set to the live URL and redeployed
- [ ] Chat widget answers on the live site
- [ ] `/dashboard` redirects to `/login` in a private browser window
- [ ] Telegram `/help` replies
- [ ] A plain message creates a task in the dashboard

---

## Ongoing

Every push to `main` deploys automatically. Before pushing:

```bash
npm run check     # typecheck + lint + build
```

If you change `prisma/schema.prisma`, run `npm run db:push` against the live
database too — a deploy does not migrate it for you.
