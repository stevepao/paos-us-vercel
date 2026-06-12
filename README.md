# Pao Family Next.js Frontend

This is the Next.js App Router frontend for `https://paos.us`. WordPress remains
the editorial backend at `https://api.paos.us`, while the public site, comments,
contact form, sitemap, RSS feed, social previews, and privacy/auth flows are
served by Next.js on Vercel.

## What It Does

- Renders public WordPress posts from the `featured-photo` and `yhpao`
  categories.
- Preserves dated WordPress post URLs such as
  `/2026/01/happy-new-year-2026/`.
- Allows approved Google accounts to see private posts through `/all-posts/`.
- Keeps private content gated both in Next.js and in WPGraphQL via a shared
  server token.
- Sanitizes and styles WordPress HTML, including legacy tables, image alignment,
  lists, iframes, and self-hosted video blocks.
- Provides Google-authenticated comment submission to WordPress REST.
- Provides a Next.js SMTP contact form with optional Cloudflare Turnstile.
- Owns SEO metadata, JSON-LD for public posts, `sitemap.xml`, `robots.txt`, and
  RSS feeds.
- Includes `/privacy/` and `/terms/` pages for Google OAuth review.
- Uses Vercel Analytics.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app is configured through environment variables. See `.env.example` for the
current list. In production, the WordPress-related URLs should point at
`https://api.paos.us`; local development can also point there.

## Important Environment Areas

- `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and `NEXTAUTH_URL` describe the frontend
  origin.
- `WORDPRESS_SITE_URL`, `WORDPRESS_API_URL`, `WORDPRESS_REST_URL`, and
  `WORDPRESS_MEDIA_BASE_URL` describe the WordPress backend.
- `WORDPRESS_GRAPHQL_AUTH_TOKEN` must match `PAOS_GRAPHQL_SERVER_TOKEN` in
  WordPress `wp-config.php`.
- `AUTHORIZED_GOOGLE_EMAILS` controls who can see `/all-posts/` and private
  post pages.
- `WORDPRESS_COMMENTS_USERNAME` and
  `WORDPRESS_COMMENTS_APPLICATION_PASSWORD` are optional WordPress REST
  credentials for comment submission.
- `SMTP_*` and `CONTACT_TO` configure the contact form.
- `NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY` and `CONTACT_TURNSTILE_SECRET_KEY`
  enable Cloudflare Turnstile for the contact form.
- `REVALIDATE_SECRET` protects `/api/revalidate`.
- `SOCIAL_*_URL` values control footer social links.

## WordPress Must-Use Plugins

Install the mu-plugins from `wordpress/mu-plugins/` into the backend:

- `paos-wpgraphql-private-content.php` restricts anonymous WPGraphQL access to
  public categories and redacts private body/comment/media fields.
- `paos-backend-only.php` redirects normal anonymous browsing of
  `api.paos.us` back to `https://paos.us` while allowing APIs, media, and core
  WordPress admin/login paths.

For private-content rendering through Next.js, add this to WordPress
`wp-config.php`:

```php
define('PAOS_GRAPHQL_SERVER_TOKEN', 'replace-with-a-long-random-secret');
```

Set the same value in Vercel/Next:

```env
WORDPRESS_GRAPHQL_AUTH_TOKEN=replace-with-a-long-random-secret
```

Public GraphQL requests remain anonymous by design. Authenticated GraphQL is
used only by server-side Next.js code for `/all-posts/` and authorized private
post pages.

## Comments, Contact, And Revalidation

Existing comments render publicly on public posts. New comments require Google
Sign-In and are submitted by a Next.js API route to WordPress REST. The Google
profile name/email become the WordPress comment author fields.

The contact form sends mail through SMTP, uses a honeypot, validates fields
server-side, and optionally verifies Cloudflare Turnstile.

WordPress is wired through a webhook plugin to call `/api/revalidate` with
`REVALIDATE_SECRET` when content changes. Manual revalidation is also available:

```bash
curl -X POST 'https://paos.us/api/revalidate?token=REVALIDATE_SECRET' \
  -H 'Content-Type: application/json' \
  --data '{"uri":"/2026/01/happy-new-year-2026/","slug":"happy-new-year-2026"}'
```

## Known Media Limitation

Some old posts contain legacy embedded YouTube iframes. These work in Chrome on
macOS, but may not work by default in Safari or on iPhone, including Chrome on
iPhone.

The reason is that the embeds are third-party YouTube iframes. Safari and all
iOS browsers use WebKit and apply stricter cross-site tracking, cookie, and
third-party iframe restrictions than Chrome on macOS. Content blockers, private
browsing, and Safari's privacy protections can prevent YouTube's embedded player
from loading or playing even though the same iframe works in desktop Chrome.

Self-hosted WordPress MP4 video blocks are rendered as `<video>` elements and are
separate from this YouTube iframe limitation.

## Backend Hardening Notes

The WordPress backend should keep:

- WPGraphQL
- Redirection, if legacy rules are still needed
- backup/security/mail plugins that are actively used

Frontend-only WordPress plugins such as AMP, Theme My Login, WPForms, sitemap
plugins, social widgets, and theme customization helpers are generally no longer
needed after the headless migration.

Recommended GraphQL hardening:

- Keep the privacy mu-plugin active.
- Rate-limit `/graphql` at Cloudflare.
- Consider a WPGraphQL max query depth around `7`.
- Keep private GraphQL access behind `WORDPRESS_GRAPHQL_AUTH_TOKEN`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Verification

Before deployment or after environment changes:

```bash
npm run lint
npm run build
```

Smoke-test:

- Homepage and recent posts.
- A public featured-photo post.
- A public Y.H. Pao post.
- `/all-posts/` as an authorized Google user.
- A private post as an authorized Google user.
- Contact form and Turnstile.
- Comment submission/moderation.
- `/sitemap.xml`, `/feed.xml`, `/robots.txt`.
- Social previews with LinkedIn/Meta tools.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
