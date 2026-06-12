function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return trimTrailingSlash(
    process.env.SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000",
  );
}

export function getWordPressSiteUrl(): string {
  return trimTrailingSlash(process.env.WORDPRESS_SITE_URL ?? "https://paos.us");
}

export function getWordPressGraphqlUrl(): string {
  return (
    process.env.WORDPRESS_API_URL ??
    `${getWordPressSiteUrl()}/graphql`
  );
}

export function getWordPressGraphqlAuthToken(): string | undefined {
  return getOptionalEnv("WORDPRESS_GRAPHQL_AUTH_TOKEN");
}

export function getWordPressRestUrl(): string {
  return trimTrailingSlash(
    process.env.WORDPRESS_REST_URL ?? `${getWordPressSiteUrl()}/wp-json`,
  );
}

export function getWordPressMediaBaseUrl(): string {
  return trimTrailingSlash(
    process.env.WORDPRESS_MEDIA_BASE_URL ??
      `${getWordPressSiteUrl()}/wp-content/uploads`,
  );
}

export function getPublicCategorySlug(): string {
  return getPublicCategorySlugs()[0] ?? "featured-photo";
}

export function getPublicCategorySlugs(): string[] {
  const raw =
    process.env.WORDPRESS_PUBLIC_CATEGORY_SLUGS ??
    process.env.WORDPRESS_PUBLIC_CATEGORY_SLUG ??
    "featured-photo";
  const slugs = new Set(
    raw
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );

  slugs.add("yhpao");

  return [...slugs];
}

export function getPrebuildPostLimit(): number {
  const value = Number(process.env.WORDPRESS_PREBUILD_POST_LIMIT ?? 8);
  return Number.isFinite(value) && value >= 0 ? value : 8;
}

export function getPublicPageSlugs(): Set<string> {
  const raw =
    process.env.WORDPRESS_PUBLIC_PAGE_SLUGS ?? "home,posts,contact,directions,yhpao";

  return new Set(
    raw
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
}

export function getAuthorizedGoogleEmails(): Set<string> {
  const raw = process.env.AUTHORIZED_GOOGLE_EMAILS ?? "";

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getRevalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}
