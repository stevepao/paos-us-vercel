# Cloudflare Workers migration (paos.us)

Frontend runs on Cloudflare Workers via `@opennextjs/cloudflare`. WordPress at
`api.paos.us` stays untouched until DNS/custom-domain cutover is verified.

## Commands

```bash
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy -- --keep-vars
./scripts/sync-wrangler-secrets.sh
```

For production builds, override local `.env.local` site URLs so sitemap/metadata
do not bake `localhost`:

```bash
SITE_URL=https://paos.us \
NEXT_PUBLIC_SITE_URL=https://paos.us \
NEXTAUTH_URL=https://paos.us \
npx opennextjs-cloudflare deploy -- --keep-vars
```

Preview Worker: `https://paos-us.spao-ai.workers.dev`

## Contact email

- Local / Node: Nodemailer
- Workers: `@workermailer/smtp` (`USE_WORKERMAILER=true` in `wrangler.jsonc`)
- Requires OpenNext patch so `cloudflare:sockets` stays external
  (`patches/@opennextjs+cloudflare+1.20.15.patch`)

## Preview smoke checklist

- [x] Home
- [x] Dated post
- [x] Contact page loads
- [x] `/api/revalidate` for existing slug
- [x] `/feed.xml`, `/sitemap.xml` (hosts match Worker URL after rebuild)
- [ ] Turnstile hostnames include `paos.us`, `www.paos.us`, `*.workers.dev`
- [ ] Google OAuth callbacks for prod + `https://paos-us.spao-ai.workers.dev/api/auth/callback/google`
- [ ] Google login round-trip + `/all-posts/` (set `AUTHORIZED_GOOGLE_EMAILS` Worker secret)
- [ ] Real contact SMTP send
- [ ] Comment post after login

Keep WordPress webhooks pointed at **Vercel** until the Worker serves `paos.us`.

## DNS cutover and Vercel teardown

DNS is already on Cloudflare. Existing A/CNAME records blocked Workers
**Custom Domains** (`code: 100117`), so cutover uses **zone routes** in
`wrangler.jsonc` (`paos.us` / `www.paos.us` with `zone_name: "paos.us"`).
Hostnames must stay orange-cloud (proxied) for Worker routes to run.

1. Worker `paos-us` routes are already configured for `paos.us` / `www.paos.us`.
2. **Enable orange-cloud (proxied) DNS** for apex `paos.us` and `www`. Today those
   records resolve to Vercel (`216.150.*` / `vercel-dns-017.com`) without
   `cf-ray`, so Worker routes never see the traffic. Proxied DNS is required.
3. Private-window smoke on `https://paos.us` (not only workers.dev).
4. Point WordPress webhook at `https://paos.us/api/revalidate?token=…`
5. Disconnect Vercel Git so `main` pushes no longer redeploy Vercel.
6. Merge `cloudflare-workers` → `main`.
7. Delete/disable the Vercel project when traffic is gone.

Until step 2, production stays on Vercel; preview stays on
`https://paos-us.spao-ai.workers.dev`.

## Missing secret to set before OAuth smoke

`AUTHORIZED_GOOGLE_EMAILS` was empty in local `.env.local`. Copy it from Vercel
into the Worker:

```bash
printf '%s' 'you@example.com,other@example.com' | npx wrangler secret put AUTHORIZED_GOOGLE_EMAILS
```
