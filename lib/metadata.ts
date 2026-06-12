import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";
import { stripHtml } from "@/lib/html";
import type { SiteSettings, WordPressPage, WordPressPost } from "@/lib/wordpress";

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

export function buildDefaultMetadata(settings: SiteSettings): Metadata {
  return {
    metadataBase: getMetadataBase(),
    title: {
      default: settings.title,
      template: `%s | ${settings.title}`,
    },
    description: settings.description,
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": "/feed/",
      },
    },
    openGraph: {
      type: "website",
      siteName: settings.title,
      title: settings.title,
      description: settings.description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.title,
      description: settings.description,
    },
  };
}

export function buildPostMetadata(
  post: WordPressPost,
  settings: SiteSettings,
): Metadata {
  const description = stripHtml(post.excerpt || post.content).slice(0, 280);
  const image = post.featuredImage?.node?.sourceUrl;

  return {
    title: stripHtml(post.title),
    description,
    alternates: {
      canonical: post.uri,
    },
    openGraph: {
      type: "article",
      siteName: settings.title,
      title: stripHtml(post.title),
      description,
      url: post.uri,
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: stripHtml(post.title),
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildPageMetadata(
  page: WordPressPage,
  settings: SiteSettings,
): Metadata {
  const description = stripHtml(page.excerpt || page.content || settings.description).slice(
    0,
    280,
  );
  const canonical = page.uri ?? `/${page.slug}/`;

  return {
    title: stripHtml(page.title),
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      siteName: settings.title,
      title: stripHtml(page.title),
      description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title: stripHtml(page.title),
      description,
    },
  };
}
