import { NextRequest, NextResponse } from "next/server";

type RedirectionRule = {
  match_url?: string;
  url?: string;
  action_code?: number;
  action_data?: {
    url?: string;
  };
  match_data?: {
    source?: {
      flag_query?: "exact" | "ignore" | "pass";
      flag_case?: boolean;
      flag_trailing?: boolean;
      flag_regex?: boolean;
    };
  };
};

type CachedRedirects = {
  fetchedAt: number;
  rules: RedirectionRule[];
};

let redirectCache: CachedRedirects | undefined;

export async function proxy(request: NextRequest) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/wp-content/uploads/")) {
    return redirectToWordPressMedia(pathname, search);
  }

  if (shouldSkipRedirectLookup(pathname)) {
    return NextResponse.next();
  }

  const rule = await findRedirectionRule(request);
  if (!rule) {
    return NextResponse.next();
  }

  const target = getRuleTarget(rule);
  if (!target) {
    return NextResponse.next();
  }

  const redirectUrl = normalizeRedirectTarget(target, request);
  if (!redirectUrl || redirectUrl.toString() === request.nextUrl.toString()) {
    return NextResponse.next();
  }

  return NextResponse.redirect(redirectUrl, getRedirectStatus(rule));
}

export const config = {
  matcher: [
    "/wp-content/uploads/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|feed.xml|feed/|api/auth|api/contact|api/comments|api/revalidate).*)",
  ],
};

function redirectToWordPressMedia(pathname: string, search: string) {
  const mediaBase =
    process.env.WORDPRESS_MEDIA_BASE_URL ??
    `${getWordPressSiteUrl()}/wp-content/uploads`;
  const mediaPath = pathname.replace(/^\/wp-content\/uploads\/?/, "");
  const target = `${mediaBase.replace(/\/+$/, "")}/${mediaPath}${search}`;

  return NextResponse.redirect(target, 301);
}

function shouldSkipRedirectLookup(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/api/")) {
    return true;
  }

  if (pathname.includes(".")) {
    return true;
  }

  return false;
}

async function findRedirectionRule(
  request: NextRequest,
): Promise<RedirectionRule | undefined> {
  const rules = await getRedirectionRules();
  if (!rules.length) {
    return undefined;
  }

  return rules.find((rule) => ruleMatchesRequest(rule, request));
}

async function getRedirectionRules(): Promise<RedirectionRule[]> {
  const apiUrl = process.env.WORDPRESS_REDIRECTION_API_URL;
  const username = process.env.WORDPRESS_REDIRECTION_USERNAME;
  const password = process.env.WORDPRESS_REDIRECTION_APPLICATION_PASSWORD;
  const ttlSeconds = Number(process.env.WORDPRESS_REDIRECTION_CACHE_TTL_SECONDS ?? 300);

  if (!apiUrl || !username || !password) {
    return [];
  }

  const now = Date.now();
  if (redirectCache && now - redirectCache.fetchedAt < ttlSeconds * 1000) {
    return redirectCache.rules;
  }

  const response = await fetch(apiUrl, {
    headers: {
      authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
    next: {
      revalidate: ttlSeconds,
    },
  }).catch(() => undefined);

  if (!response?.ok) {
    return redirectCache?.rules ?? [];
  }

  const payload = (await response.json()) as unknown;
  const rules = Array.isArray(payload) ? (payload as RedirectionRule[]) : [];

  redirectCache = {
    fetchedAt: now,
    rules,
  };

  return rules;
}

function ruleMatchesRequest(rule: RedirectionRule, request: NextRequest): boolean {
  const source = rule.match_url;
  if (!source) {
    return false;
  }

  const flags = rule.match_data?.source;
  const requestPath =
    flags?.flag_query === "exact"
      ? `${request.nextUrl.pathname}${request.nextUrl.search}`
      : request.nextUrl.pathname;

  if (flags?.flag_regex) {
    try {
      const regex = new RegExp(source, flags.flag_case ? undefined : "i");
      return regex.test(requestPath);
    } catch {
      return false;
    }
  }

  let expected = source.startsWith("/") ? source : `/${source}`;
  let actual = requestPath;

  if (!flags?.flag_case) {
    expected = expected.toLowerCase();
    actual = actual.toLowerCase();
  }

  if (flags?.flag_trailing !== false) {
    expected = normalizeTrailingSlash(expected);
    actual = normalizeTrailingSlash(actual);
  }

  return expected === actual;
}

function getRuleTarget(rule: RedirectionRule): string | undefined {
  return rule.action_data?.url ?? rule.url;
}

function getRedirectStatus(rule: RedirectionRule): 301 | 302 | 307 | 308 {
  const code = rule.action_code;
  return code === 302 || code === 307 || code === 308 ? code : 301;
}

function normalizeRedirectTarget(
  target: string,
  request: NextRequest,
): URL | undefined {
  try {
    const url = new URL(target, request.nextUrl);
    const wordpressSite = new URL(getWordPressSiteUrl());

    if (url.hostname === wordpressSite.hostname) {
      url.protocol = request.nextUrl.protocol;
      url.host = request.nextUrl.host;
    }

    if (!url.search && request.nextUrl.search) {
      url.search = request.nextUrl.search;
    }

    return url;
  } catch {
    return undefined;
  }
}

function normalizeTrailingSlash(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function getWordPressSiteUrl(): string {
  return (process.env.WORDPRESS_SITE_URL ?? "https://paos.us").replace(/\/+$/, "");
}
