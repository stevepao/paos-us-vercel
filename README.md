# paos-us-vercel

`paos-us-vercel` is the Next.js App Router frontend for `https://paos.us`.
It is designed to move the public site from a WordPress-rendered frontend to a
headless WordPress backend while preserving existing URLs and public content
rules.

## What It Does

- Renders public WordPress posts from the `featured-photo` and `yhpao`
  categories.
- Preserves dated WordPress URLs such as `/2026/01/happy-new-year-2026/`.
- Redirects private or account-related WordPress routes back to the WordPress
  backend.
- Sanitizes WordPress post HTML before rendering it in the Next.js app.
- Supports public archives, category pages, search, legacy upload redirects,
  comments, and the contact form.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the sample environment file and fill in local values as needed:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

By default, local development reads WordPress content from the current
production WordPress APIs at `https://paos.us`. The frontend should never expose
WordPress editing or site-management operations.

## Configuration

The application is configured through environment variables. See
`.env.example` for the current list of supported settings.

Important configuration areas include:

- WordPress REST and GraphQL endpoints.
- Optional authenticated WordPress GraphQL access for private-content handling.
- Google sign-in for comment submission.
- WordPress application-password credentials for comment submission.
- SMTP settings for the contact form.
- Optional WordPress Redirection plugin mirroring.

## Content And Privacy Rules

Public posts are limited to the `featured-photo` and `yhpao` categories.
Non-public post URLs redirect to the WordPress login flow instead of rendering
content.

Search uses WordPress REST search, but each post result is checked against the
same public-content rule before rendering. Recent public posts are prerendered
at build time according to `WORDPRESS_PREBUILD_POST_LIMIT`; older public posts
still render on demand.

The draft must-use plugin at
`wordpress/mu-plugins/paos-wpgraphql-private-content.php` is intended for the
future WordPress backend. After staging validation, install it in
`wp-content/mu-plugins/` to restrict anonymous WPGraphQL post lists and redact
private body, comment, and media fields.

For authorized private-content rendering through the Next.js frontend, define a
shared server token in WordPress:

```php
define('PAOS_GRAPHQL_SERVER_TOKEN', 'replace-with-a-long-random-secret');
```

Set the same value in the Next.js environment:

```env
WORDPRESS_GRAPHQL_AUTH_TOKEN=replace-with-a-long-random-secret
```

## Comments And Contact

Existing WordPress comments render publicly on public posts. New comments
require Google sign-in and are submitted through a Next.js API route to
WordPress REST.

If WordPress blocks anonymous REST comment creation, set
`WORDPRESS_COMMENTS_USERNAME` and `WORDPRESS_COMMENTS_APPLICATION_PASSWORD` for
a dedicated comment-submission integration user. Prefer an application password
label such as `paos-next-comments-submit`.

The contact form sends email with SMTP, using Purelymail-compatible environment
variables. It includes server-side validation and a honeypot field.

During local development, `GET /api/comments` reports whether Google auth and
WordPress comment credentials are configured. It returns 404 in production.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Deployment

This project is intended to deploy on Vercel. Configure the same environment
variables in Vercel that are required for the target environment, then use the
standard Vercel build command:

```bash
npm run build
```

## License

This project is licensed under the MIT License. See `LICENSE` for details.
