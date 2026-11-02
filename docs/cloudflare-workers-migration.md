# Cloudflare Workers (paos.us)

Production frontend runs on **Cloudflare Workers** via `@opennextjs/cloudflare`.
Worker name: `paos-us`. Site: `https://paos.us`. WordPress remains at
`api.paos.us`.

The GitHub repo is still named `paos-us-vercel` for historical reasons only.

## Current setup (post-migration)

- **Runtime:** Cloudflare Worker `paos-us` (OpenNext)
- **Routes:** zone routes for `paos.us` / `www.paos.us` (proxied DNS)
- **Preview:** `https://paos-us.spao-ai.workers.dev`
- **Cache:** R2 `paos-us-next-cache`, D1 `paos-us-next-tag-cache`, DO queue
- **Mail:** Nodemailer locally; `@workermailer/smtp` on Workers
  (`USE_WORKERMAILER=true`)
- **OpenNext patch:** `patches/@opennextjs+cloudflare+1.20.15.patch` (keeps
  `cloudflare:sockets` external for WorkerMailer)
- **Git → deploy:** Workers Builds connected to `stevepao/paos-us-vercel` on
  `main` (push to `main` should build/deploy). Confirm in dashboard if unsure.
- **Vercel:** Git disconnected; project can be deleted when you no longer need
  rollback

## Commands

```bash
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy -- --keep-vars
./scripts/sync-wrangler-secrets.sh
```

For manual production deploys, set site URLs so sitemap/metadata do not bake
`localhost` from `.env.local`:

```bash
SITE_URL=https://paos.us \
NEXT_PUBLIC_SITE_URL=https://paos.us \
NEXTAUTH_URL=https://paos.us \
NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY=… \
npx opennextjs-cloudflare deploy -- --keep-vars
```

`--keep-vars` preserves dashboard/runtime secrets across deploys.

## Workers Builds (GitHub)

If connected in the dashboard:

| Setting | Value |
|---------|--------|
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy -- --keep-vars` |
| Production branch | `main` |

**Build variables** must include at least `SITE_URL`, `NEXT_PUBLIC_SITE_URL`,
`NEXTAUTH_URL`, `NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY`, and the WordPress
GraphQL/URL vars needed for SSG. Runtime secrets (Auth, SMTP, Turnstile secret,
redirection username/password, `AUTHORIZED_GOOGLE_EMAILS`, etc.) live under
Worker **Variables and Secrets** — redirection creds are **runtime only**.

Rotating Turnstile **site** keys requires updating the Build var and a new
deploy so `NEXT_PUBLIC_*` is rebuilt.

## Contact / Auth notes

- Turnstile hostnames: `paos.us`, `www.paos.us`, `paos-us.spao-ai.workers.dev`
- Google OAuth redirect URIs:  
  `https://paos.us/api/auth/callback/google`  
  `https://paos-us.spao-ai.workers.dev/api/auth/callback/google`
- WordPress revalidate webhook:  
  `https://paos.us/api/revalidate?token=REVALIDATE_SECRET`

## Smoke checklist (completed for cutover)

- [x] Home, dated post, contact page
- [x] Google login + allowlisted access
- [x] Turnstile (after rebuild with new site key)
- [x] `/api/revalidate` for existing slug
- [x] `/feed.xml`, `/sitemap.xml` with `https://paos.us` hosts
- [x] Proxied DNS + zone routes serving Worker (not Vercel)
- [x] Merge `cloudflare-workers` → `main`; disconnect Vercel Git
- [ ] Optional: delete Vercel project when rollback window is over
- [ ] Optional: confirm first Workers Builds run from empty commit / push

## Sync secrets

```bash
./scripts/sync-wrangler-secrets.sh
```
