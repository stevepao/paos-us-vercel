import { getSiteUrl } from "@/lib/env";
import { stripHtml } from "@/lib/html";
import type { SiteSettings, WordPressPost } from "@/lib/wordpress";

type PostJsonLdProps = {
  post: WordPressPost;
  settings: SiteSettings;
};

export function PostJsonLd({ post, settings }: PostJsonLdProps) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${post.uri}`;
  const image = post.featuredImage?.node?.sourceUrl;
  const websiteId = `${siteUrl}/#website`;
  const authorId = `${siteUrl}/#stephen-pao`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: stripHtml(post.title),
    description: stripHtml(post.excerpt || post.content).slice(0, 280),
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: url,
    url,
    isPartOf: {
      "@id": websiteId,
      name: settings.title,
    },
    author: {
      "@id": authorId,
    },
    publisher: {
      "@id": authorId,
    },
    image: image ? [image] : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
