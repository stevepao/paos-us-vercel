# Headless WordPress Migration Plan

This document summarizes the work that went into migrating this site from a
WordPress-rendered frontend to a small Next.js App Router frontend. It is meant
as a repeatable plan for another WordPress site of similar scope.

## Goal

Build a React/Next.js frontend that keeps WordPress as the editorial backend,
while preserving the important migration behavior readers and crawlers expect:
stable URLs, redirects, social previews, sitemap and RSS, cache refreshes, and
working forms/comments.

The approach here was bottoms-up rather than adopting a larger WordPress
frontend framework. That kept the surface area small and made the migration
behavior explicit.

## Pao Family Site Assumptions

These assumptions are specific to the `https://paos.us` migration from a
WordPress-rendered frontend to a Next.js App Router frontend. The current
repository contains the implemented frontend and supporting WordPress mu-plugins.

Current WordPress shape:

- The public site is `Pao Family`, with description `Stephen, Marsha, Christina,
  Annalisa`.
- WordPress now acts as the backend at `https://api.paos.us`. During local
  development, the frontend may read that backend, but should not expose post
  editing, page editing, or other site-management operations.
- WPGraphQL is available at `/graphql`, and WordPress REST is available at
  `/wp-json`.
- The old frontend was Genesis with the `workstation-pro` child theme and AMP
  standard mode. The Next.js frontend now owns public rendering.
- There are about 71 posts, 13 pages, 6 categories, and no tags observed.
- Sitemap generation is owned by Next.js.

Public content and auth:

- Posts in the `featured-photo` and `yhpao` categories are public.
- Private posts are visible in the Next.js frontend only to signed-in Google
  accounts listed in `AUTHORIZED_GOOGLE_EMAILS`.
- WPGraphQL privacy is enforced WordPress-side with the mu-plugin at
  `wordpress/mu-plugins/paos-wpgraphql-private-content.php`. Anonymous
  WPGraphQL requests can read public categories only. Trusted server-to-server
  requests from Next.js include `WORDPRESS_GRAPHQL_AUTH_TOKEN`, matching
  `PAOS_GRAPHQL_SERVER_TOKEN` in WordPress.
- The Next.js frontend should still enforce the same public-content rule as a
  defense-in-depth measure.
- WordPress admin/login flows use backend/core WordPress paths. Frontend user
  auth for comments and private views uses Google Sign-In through Auth.js.

Routes and URLs:

- Preserve dated post URLs exactly:

```text
/YYYY/MM/post-slug/
```

- Keep public page URLs at their current root paths where applicable, including
  `/`, `/posts/`, `/contact/`, `/directions/`, `/yhpao/`, `/welcome/`,
  `/holiday201/`, and `/pokemon-go-the-grind-begins/`.
- Preserve public category archive URLs such as `/category/featured-photo/` and
  `/category/yhpao/` when they are useful for discovery or redirects.
- Because dated post URLs are retained, a `/blog/[slug]` route is not needed for
  this site unless the URL strategy changes later.

Comments:

- Existing WordPress comments should remain visible on migrated public posts.
- Unauthenticated visitors may read public comments.
- Comment submission should require Sign in with Google.
- Recommended approach: let the Next.js app own Google sign-in, then submit
  comments through a Next API route. The route verifies the Google session,
  maps the profile to WordPress comment author fields, and posts to the
  WordPress REST comments endpoint server-side.
- This avoids requiring visitors to create WordPress accounts while preserving
  WordPress comments, moderation, and spam tooling.
- During local development, comment posting can work against WordPress if the
  necessary credentials and callback URLs are configured. Other WordPress
  operations should remain read-only.

Contact form:

- Replace the WPForms contact page behavior with a Next.js contact API route.
- Use SMTP through Purelymail.
- Use `webmaster@hillwork.com` as the sender.
- Send contact messages to `us@spao.net`.
- Cloudflare Turnstile protects the contact form. Comments rely on Google
  Sign-In rather than a separate Turnstile challenge.

Backend lockdown:

- `api.paos.us` is locked down for normal end-user browser access with
  `wordpress/mu-plugins/paos-backend-only.php`.
- Keep the WordPress content APIs, comment submission endpoint, GraphQL endpoint
  as appropriate, and media uploads publicly reachable enough for the frontend.
- Keep WordPress admin/editor access protected.

Recommended WordPress application password:

- Prefer a dedicated WordPress integration user such as `next-api-reader`.
- Use an application password label such as
  `paos-next-api-redirection-read`.
- Grant the minimum role that can read Redirection rules. If the Redirection
  plugin requires admin capability, use a dedicated admin account only for this
  integration, store the password only in environment variables, and rotate it
  after launch.

Pao-specific environment variables:

```env
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

WORDPRESS_SITE_URL=https://api.paos.us
WORDPRESS_API_URL=https://api.paos.us/graphql
WORDPRESS_REST_URL=https://api.paos.us/wp-json
WORDPRESS_MEDIA_BASE_URL=https://api.paos.us/wp-content/uploads
WORDPRESS_GRAPHQL_AUTH_TOKEN=
WORDPRESS_PUBLIC_CATEGORY_SLUGS=featured-photo,yhpao
WORDPRESS_PUBLIC_PAGE_SLUGS=home,posts,contact,directions,yhpao
WORDPRESS_PREBUILD_POST_LIMIT=8

REVALIDATE_SECRET=

WORDPRESS_REDIRECTION_API_URL=https://api.paos.us/wp-json/redirection/v1/redirect
WORDPRESS_REDIRECTION_USERNAME=
WORDPRESS_REDIRECTION_APPLICATION_PASSWORD=
WORDPRESS_REDIRECTION_CACHE_TTL_SECONDS=300

WORDPRESS_COMMENTS_USERNAME=
WORDPRESS_COMMENTS_APPLICATION_PASSWORD=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=webmaster@hillwork.com
CONTACT_TO=us@spao.net
SMTP_SECURE=false

AUTH_SECRET=
NEXTAUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTHORIZED_GOOGLE_EMAILS=
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET_KEY=

SOCIAL_LINKEDIN_URL=
SOCIAL_X_URL=
SOCIAL_BLUESKY_URL=
SOCIAL_FACEBOOK_URL=
SOCIAL_INSTAGRAM_URL=
SOCIAL_SUBSTACK_URL=
SOCIAL_YOUTUBE_URL=
SOCIAL_LINK_IN_BIO_URL=

SCHEMA_STEPHEN_PAO_SAME_AS=
SCHEMA_MARSHA_PAO_SAME_AS=
SCHEMA_CHRISTINA_PAO_SAME_AS=
SCHEMA_ANNALISA_PAO_SAME_AS=
```

For production, set `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and `NEXTAUTH_URL` to
`https://paos.us`.

## Recommended Build Order

1. Establish the Next.js project foundation.
2. Connect WordPress content APIs.
3. Build public routes and sanitized content rendering.
4. Add SEO, sitemap, robots, and RSS.
5. Handle URL migration: internal link rewrites and redirects.
6. Add cache revalidation webhooks.
7. Add forms, comments, auth, and spam protection.
8. Add recovery pages and launch observability.

## 1. Project Foundation

Start with a standard Next.js App Router project using TypeScript.

Core setup:

- Add `.env.example` with all required integration variables.
- Add `README.md` with setup, deployment, and environment notes.
- Add license and repository metadata.
- Configure `next.config.ts` for the target deployment platform.
- If using Vercel and wanting to avoid image optimization charges, set:

```ts
images: {
  unoptimized: true;
}
```

For Next.js 16, read the local Next docs before implementing special files. Some
file conventions have changed, including `proxy.ts` replacing the older
`middleware.ts` convention.

## 2. WordPress Content APIs

Use WPGraphQL for page/post content when available, and WordPress REST for
plugin-specific metadata or features.

Typical environment variables:

```env
WORDPRESS_API_URL=https://example.com/graphql
SITE_URL=https://www.example.com
```

Create a WordPress API layer similar to `lib/wordpress.ts`:

- `wpFetch()` for GraphQL.
- REST fetch helpers for SEO plugin data.
- Typed return values for posts, pages, comments, categories, and archives.
- Fetch cache tags for broad revalidation.

Useful functions to expose:

- Latest posts.
- Featured posts.
- All posts.
- Search results.
- Category archive posts.
- Month archive posts.
- Post detail by slug.
- Page detail by URI.
- Adjacent posts.
- WordPress SEO data by slug/URI.

## 3. Public Routes

Build the frontend routes around the new public URL structure.

For this project:

- `/`
- `/posts/`
- `/all-posts/`
- `/YYYY/MM/post-slug/`
- `/contact/`
- `/directions/`
- `/yhpao/`
- `/privacy/`
- `/terms/`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`

Important route behavior:

- Use `generateStaticParams()` for known posts.
- Do not set `dynamicParams = false` if new WordPress posts should work without
  a full redeploy.
- Use `notFound()` when WordPress returns no post/page.
- Sanitize WordPress HTML before rendering with `dangerouslySetInnerHTML`.
- Preserve basic WordPress formatting: headings, lists, blockquotes, tables,
  figures, image alignment, iframes, self-hosted videos, and links.

## 4. SEO And Social Previews

Implement SEO with the Next.js Metadata API, not client-side tags.

For dynamic WordPress routes:

- Add an async `generateMetadata()` function.
- Await `params` in Next.js App Router pages.
- Fetch the WordPress SEO data separately in `generateMetadata()` and the page.
  Let Next.js caching dedupe where possible.
- Use `metadataBase` from `SITE_URL`.
- Emit absolute Open Graph and Twitter image URLs.
- Prefer the frontend canonical URL over the WordPress backend canonical URL.

Create a helper like `lib/metadata.ts`:

- `getMetadataBase()`
- `buildDefaultMetadata()`
- `buildWordPressMetadata()`

Map Yoast/RankMath REST SEO data when present:

- Title.
- Description.
- Canonical.
- Robots.
- Open Graph title/description/image.
- Twitter title/description/image.
- Published and modified timestamps.

## 5. Sitemap, Robots, And RSS

Add dynamic metadata routes:

- `app/sitemap.ts`
- `app/robots.ts`
- `app/feed.xml/route.ts`

Sitemap behavior:

- Include static routes.
- Fetch published WordPress posts.
- Use frontend URLs, not WordPress backend URLs.
- Use WordPress `modified` dates for `lastModified`.
- Revalidate periodically, for example every hour.

Robots behavior:

- Allow public crawling.
- Point to the sitemap.
- Use `SITE_URL` for host/sitemap values.

RSS behavior:

- Expose `/feed.xml`.
- Include recent posts with title, link, GUID, publish date, and excerpt.
- Add RSS discovery metadata:

```ts
alternates: {
  types: {
    "application/rss+xml": "/feed.xml",
  },
}
```

## 6. URL Migration And Internal Links

Plan for both old external URLs and links embedded inside article content.

For this project, dated WordPress article permalinks are preserved:

```text
https://paos.us/2018/11/post-slug/
```

Rewrite links in sanitized HTML:

- Backend WordPress origin to frontend origin.
- Same-domain dated WordPress post permalinks to dated frontend paths.
- Same-domain legacy links, not only backend API-domain links.
- Preserve query strings and hash fragments.

Apply that transform wherever WordPress HTML is rendered:

- Post content.
- Comment content.
- WordPress-backed pages such as `/yhpao/`.

Also rewrite embedded WordPress media URLs in raw post HTML. These are separate
from anchor links and usually appear in `img` attributes:

```html
<img src="http://example.com/wp-content/uploads/2020/01/image.jpg" />
```

The frontend should normalize media references to the WordPress backend media
host:

```text
https://api.example.com/wp-content/uploads/2020/01/image.jpg
```

Handle both:

- `img src`
- `img srcset`

This matters because raw WordPress HTML is rendered directly by the browser.
Next.js image configuration does not rewrite image URLs inside
`dangerouslySetInnerHTML`.

Known media limitation for this site:

- Legacy YouTube embeds are third-party iframes. They work in Chrome on macOS,
  but may not work by default in Safari or on iPhone, including Chrome on iPhone,
  because iOS browsers use WebKit and Safari/WebKit applies stricter
  cross-site-tracking, cookie, and third-party iframe restrictions. Content
  blockers and private browsing can also prevent YouTube's embedded player from
  loading or playing.
- Self-hosted WordPress MP4 video blocks are rendered as `<video>` elements and
  are separate from this YouTube iframe limitation.

## 7. Redirects

If the WordPress Redirection plugin is used, mirror those rules at the frontend
edge/server boundary.

For Next.js 16, use `proxy.ts` at the project root. The older `middleware.ts`
file convention is deprecated.

Environment variables:

```env
WORDPRESS_REDIRECTION_API_URL=https://api.example.com/wp-json/redirection/v1/redirect
WORDPRESS_REDIRECTION_USERNAME=
WORDPRESS_REDIRECTION_APPLICATION_PASSWORD=
WORDPRESS_REDIRECTION_CACHE_TTL_SECONDS=300
```

Implementation behavior:

- Fetch `/wp-json/redirection/v1/redirect`.
- Authenticate with a WordPress Application Password if the endpoint is
  protected.
- Cache the redirect list.
- Match GET/HEAD frontend requests.
- Exclude API routes, static assets, image routes, `robots.txt`, `sitemap.xml`,
  and most file-like URLs.
- Support common Redirection plugin fields:
  - `match_url`
  - `url`
  - `action_data.url`
  - `action_code`
  - `match_data.source.flag_query`
  - `match_data.source.flag_case`
  - `match_data.source.flag_trailing`
  - `match_data.source.flag_regex`
- Map absolute WordPress targets back to frontend URLs.
- Avoid redirect loops.

Add built-in SEO-preserving redirects for URL patterns that are part of the
WordPress migration, even if they are not explicitly listed in the Redirection
plugin.

Legacy dated article URLs are preserved where possible. Redirect rules are still
useful for older plugin/page URLs, old media URLs, and any legacy aliases found
in production logs.

Legacy media URLs should also permanently redirect so Google Image Search and
other image indexes do not hit 404s:

```text
https://www.example.com/wp-content/uploads/2020/01/image.jpg
https://api.example.com/wp-content/uploads/2020/01/image.jpg
```

Because upload URLs look like static files, make sure the proxy matcher includes
`/wp-content/uploads/:path*` explicitly. A broad "skip file-like URLs" matcher
will otherwise bypass the proxy and let old indexed image URLs 404.

## 8. Revalidation Webhooks

Add an API route:

```text
app/api/revalidate/route.ts
```

The route should accept a secret token and invalidate the affected pages and
WordPress fetch cache tags.

Useful payload formats:

```json
{
  "slug": "example-post"
}
```

or a WordPress webhook payload:

```json
{
  "post": {
    "post_name": "example-post"
  }
}
```

For webhook tools that cannot add arbitrary JSON fields, accept the token in the
URL:

```text
https://www.example.com/api/revalidate?token=REVALIDATE_SECRET
```

Revalidate:

- The affected dated post URL.
- `/`
- `/posts/`
- `/all-posts/`
- `/sitemap.xml`
- WordPress fetch tags.

Use `revalidateTag(tag, { expire: 0 })` for external webhooks that need fresh
data on the next request.

## 9. Forms, Comments, And Spam Protection

For this site, Cloudflare Turnstile protects the contact form only. Comments are
already gated by Google Sign-In.

```env
NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET_KEY=
```

Client-side behavior:

- Use explicit rendering so the widget remounts correctly during Next.js
  client-side navigation:

```text
https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit
```

- Do not rely on generic `cf-turnstile` auto-render classes in App Router pages.

Server-side behavior:

- Verify the contact Turnstile token in `app/api/contact/route.ts`.
- Return helpful errors for missing configuration, invalid tokens, and backend
  failures.

## 10. Comments And Auth.js

For this site:

- Use Auth.js with Google Sign-In.
- Store the session through Auth.js.
- Post comments through the WordPress REST API from a Next.js route.
- Store the Google profile name/email as WordPress comment author fields.
- Do not require a WordPress account for commenters.

Expected WordPress endpoint:

```text
POST /wp-json/wp/v2/comments
```

## 11. Recovery And Launch Pages

Add a custom `app/not-found.tsx` page.

Include:

- A clear 404 message.
- Link to home.
- Link to public posts, or all posts for authorized users.
- Search form for public posts.
- Contact link.
- Recent public posts from WordPress.

This is especially useful during a URL migration because some old links will be
missed initially.

## 12. Environment Checklist

Current Vercel variables for this project:

```env
SITE_URL=
NEXT_PUBLIC_SITE_URL=

WORDPRESS_SITE_URL=
WORDPRESS_API_URL=
WORDPRESS_REST_URL=
WORDPRESS_MEDIA_BASE_URL=
WORDPRESS_GRAPHQL_AUTH_TOKEN=
WORDPRESS_PUBLIC_CATEGORY_SLUGS=featured-photo,yhpao
WORDPRESS_PUBLIC_PAGE_SLUGS=home,posts,contact,directions,yhpao
WORDPRESS_PREBUILD_POST_LIMIT=8

REVALIDATE_SECRET=

WORDPRESS_REDIRECTION_API_URL=
WORDPRESS_REDIRECTION_USERNAME=
WORDPRESS_REDIRECTION_APPLICATION_PASSWORD=
WORDPRESS_REDIRECTION_CACHE_TTL_SECONDS=300

WORDPRESS_COMMENTS_USERNAME=
WORDPRESS_COMMENTS_APPLICATION_PASSWORD=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
CONTACT_TO=
SMTP_SECURE=false

AUTH_SECRET=
NEXTAUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTHORIZED_GOOGLE_EMAILS=
NEXTAUTH_URL=

SOCIAL_LINKEDIN_URL=
SOCIAL_X_URL=
SOCIAL_BLUESKY_URL=
SOCIAL_FACEBOOK_URL=
SOCIAL_INSTAGRAM_URL=
SOCIAL_SUBSTACK_URL=
SOCIAL_YOUTUBE_URL=
SOCIAL_LINK_IN_BIO_URL=

SCHEMA_STEPHEN_PAO_SAME_AS=
SCHEMA_MARSHA_PAO_SAME_AS=
SCHEMA_CHRISTINA_PAO_SAME_AS=
SCHEMA_ANNALISA_PAO_SAME_AS=

NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET_KEY=
```

Only include variables needed by the site. For this project, comments use Google
Sign-In and do not use a separate Turnstile widget.

## 13. WordPress-Side Checklist

Before launch:

- Confirm WPGraphQL works.
- Confirm REST API works.
- Configure Redirection plugin rules.
- Create a WordPress Application Password for redirect-rule reads.
- Install `paos-wpgraphql-private-content.php` and define
  `PAOS_GRAPHQL_SERVER_TOKEN` in `wp-config.php`.
- Install `paos-backend-only.php` to redirect normal `api.paos.us` browsing back
  to the frontend while leaving APIs, media, and admin/login paths available.
- Deactivate frontend-only WordPress plugins that the Next.js frontend replaces
  such as AMP, Theme My Login, WPForms, sitemap plugins, social widgets, and
  theme-rendering helpers.
- Configure Cloudflare/rate limits/query-depth limits for `/graphql`.
- Configure webhook plugin to POST to:

```text
https://www.example.com/api/revalidate?token=REVALIDATE_SECRET
```

- Confirm webhook payload includes a post slug or `post.post_name`.
- Confirm old URL patterns and internal permalink patterns.

## 14. Verification Checklist

Run locally:

```bash
npm run lint
npm run build
```

Spot-check before launch:

- Homepage renders posts.
- Individual post pages render.
- New/unbuilt post slugs can render.
- Dated post URLs render at their preserved paths.
- Internal article links rewrite to frontend/backend-safe URLs.
- Old `/wp-content/uploads/...` image URLs 301 to the backend media host.
- Redirection plugin rules redirect correctly.
- `/sitemap.xml` contains frontend URLs.
- `/robots.txt` points to the sitemap.
- `/feed.xml` returns valid RSS XML.
- Social preview tags are post-specific.
- X/Twitter and Facebook validators see absolute image URLs.
- Revalidation webhook refreshes the expected post.
- Contact and comment flows work.
- Privacy and Terms pages are linked in the footer and included in the sitemap.
- Contact Turnstile remounts correctly after client-side navigation.
- Public and authorized-private GraphQL reads work as expected.
- 404 page helps users recover.

After launch:

- Submit sitemap in Google Search Console and Bing Webmaster Tools.
- Inspect a few important URLs.
- Watch crawl errors and 404s.
- Add missing redirects as they appear.
- Monitor form/API errors.

## 15. Optional Enhancements

These are useful but not required for a small migrated blog:

- JSON-LD structured data for `BlogPosting` and breadcrumbs.
- Draft/preview mode for unpublished WordPress posts.
- Lightweight analytics.
- Error monitoring such as Sentry.
- Security headers. Be careful with CSP because Turnstile and third-party forms
  require external scripts.
- Webmention or ActivityPub support if the site has IndieWeb goals.

## Tips For Next Time

Use this document as a structured implementation brief, not as a one-shot script.
A similar migration has too many site-specific details to safely automate in one
large pass: permalink structure, media host, SEO plugin output, redirect plugin
access, webhook payload format, forms, comments, and deployment environment.

Recommended Cursor workflow:

1. Ask Cursor to read this plan and inspect the new repository.
2. Have Cursor produce a site-specific checklist without editing files.
3. Answer any unknowns about WordPress URLs, plugins, forms, comments, and
   deployment.
4. Implement in batches.
5. Run `npm run lint` and `npm run build` after each batch.
6. Commit each completed batch before moving on.

Good first prompt:

```text
Read docs/headless-wordpress-migration-plan.md and inspect this repository.
Create a site-specific implementation checklist for migrating this WordPress site
to a Next.js App Router frontend. Do not edit files yet. Identify which parts of
the plan apply, what environment variables are needed, and any unknowns I need
to answer.
```

Good implementation prompts:

```text
Implement phase 1 from the checklist: WordPress API layer, core routes,
sanitized post rendering, and basic environment documentation. Follow the
migration plan. Keep changes scoped and run lint/build when done.
```

```text
Implement the SEO and discovery phase from the checklist: Metadata API,
canonical URLs, Open Graph/Twitter tags, sitemap, robots, and RSS feed. Follow
the migration plan and verify with lint/build.
```

```text
Implement the migration-safety phase from the checklist: internal link rewrites,
embedded media rewrites, legacy article redirects, legacy media redirects, and
WordPress revalidation webhook support. Follow the migration plan and verify
with lint/build.
```

Batching the work reduces backtracking while still keeping the implementation
safe. The plan should prevent the main traps found during this migration:

- New post slugs failing because `dynamicParams = false`.
- Social previews using backend or site-wide URLs.
- Old dated article URLs returning 404 instead of 301.
- Old media URLs returning 404 and hurting image search continuity.
- Raw `img srcset` values still pointing at the old frontend host.
- Webhook plugins being unable to put the secret token in the JSON body.
- WordPress webhook payloads using `post.post_name` instead of `slug`.
- Next.js 16 using `proxy.ts` rather than the older `middleware.ts` convention.

## Bottom-Up Versus Faust

For a small editorial site, the bottoms-up approach is often a good fit. It
requires implementing integration details directly, but avoids inheriting a
larger framework's conventions and abstractions.

Faust or another WordPress-focused frontend framework may be a better fit when
the site needs WordPress-native previews, menus, template hierarchy, block
rendering, or a larger editorial workflow. For a site like this one, most of the
work was migration-specific and would still need to be understood and customized
even with a framework.
