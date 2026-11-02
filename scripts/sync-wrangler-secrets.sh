#!/usr/bin/env bash
# Push selected secrets from .env.local into the Cloudflare Worker.
# Requires: wrangler login (or CLOUDFLARE_API_TOKEN) and a local .env.local.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${1:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

lookup_env() {
  local name="$1"
  node --input-type=module -e "
    import { readFileSync } from 'node:fs';
    const text = readFileSync(process.argv[1], 'utf8');
    const want = process.argv[2];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const i = line.indexOf('=');
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      if (key !== want) continue;
      let value = line.slice(i + 1).trim();
      if (
        (value.startsWith('\"') && value.endsWith('\"')) ||
        (value.startsWith(\"'\") && value.endsWith(\"'\"))
      ) {
        value = value.slice(1, -1);
      }
      process.stdout.write(value);
      process.exit(0);
    }
  " "$ENV_FILE" "$name"
}

put_secret() {
  local name="$1"
  local value
  value="$(lookup_env "$name" || true)"
  if [[ -z "${value}" ]]; then
    echo "skip $name (empty)"
    return 0
  fi
  echo "put $name"
  printf '%s' "$value" | npx wrangler secret put "$name"
}

put_secret REVALIDATE_SECRET
put_secret WORDPRESS_GRAPHQL_AUTH_TOKEN
put_secret WORDPRESS_REDIRECTION_USERNAME
put_secret WORDPRESS_REDIRECTION_APPLICATION_PASSWORD
put_secret WORDPRESS_COMMENTS_USERNAME
put_secret WORDPRESS_COMMENTS_APPLICATION_PASSWORD
put_secret SMTP_USER
put_secret SMTP_PASS
put_secret CONTACT_TURNSTILE_SECRET_KEY
put_secret AUTH_SECRET
put_secret NEXTAUTH_SECRET
put_secret AUTH_GOOGLE_ID
put_secret AUTH_GOOGLE_SECRET
put_secret AUTHORIZED_GOOGLE_EMAILS
put_secret NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY
put_secret SCHEMA_STEPHEN_PAO_SAME_AS
put_secret SCHEMA_MARSHA_PAO_SAME_AS
put_secret SCHEMA_CHRISTINA_PAO_SAME_AS
put_secret SCHEMA_ANNALISA_PAO_SAME_AS
put_secret SOCIAL_LINKEDIN_URL
put_secret SOCIAL_X_URL
put_secret SOCIAL_BLUESKY_URL
put_secret SOCIAL_FACEBOOK_URL
put_secret SOCIAL_INSTAGRAM_URL
put_secret SOCIAL_SUBSTACK_URL
put_secret SOCIAL_YOUTUBE_URL
put_secret SOCIAL_LINK_IN_BIO_URL

echo "Done."
echo "Add Turnstile hostnames for *.workers.dev and paos.us in the Turnstile dashboard."
echo "Add Google OAuth callback URIs for workers.dev and https://paos.us/api/auth/callback/google."
