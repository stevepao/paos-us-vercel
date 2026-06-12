import { getSiteUrl } from "@/lib/env";
import { stripHtml } from "@/lib/html";
import { getPublicPosts, getSiteSettings } from "@/lib/wordpress";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function buildRssFeed(): Promise<string> {
  const [settings, posts] = await Promise.all([getSiteSettings(), getPublicPosts()]);
  const siteUrl = getSiteUrl();
  const lastBuildDate = posts[0]?.modified
    ? new Date(posts[0].modified).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${siteUrl}${post.uri}`;
      return `
        <item>
          <title>${escapeXml(stripHtml(post.title))}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="false">${escapeXml(`${getSiteUrl()}/?p=${post.databaseId}`)}</guid>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          <description>${escapeXml(stripHtml(post.excerpt || post.content))}</description>
        </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(settings.title)}</title>
        <link>${escapeXml(siteUrl)}</link>
        <description>${escapeXml(settings.description)}</description>
        <lastBuildDate>${lastBuildDate}</lastBuildDate>
        <language>en-US</language>
        ${items}
      </channel>
    </rss>`;
}
