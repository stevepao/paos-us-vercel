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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: stripHtml(post.title),
    description: stripHtml(post.excerpt || post.content).slice(0, 280),
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: url,
    url,
    author: {
      "@type": "Person",
      name: "Stephen Pao",
    },
    publisher: {
      "@type": "Organization",
      name: settings.title,
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
