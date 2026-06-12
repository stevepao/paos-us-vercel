import { getSiteUrl } from "@/lib/env";

export function GET() {
  const siteUrl = getSiteUrl();
  const body = `User-agent: *
Content-Signal: search=yes,ai-train=no
Allow: /
Disallow: /api/auth/
Disallow: /api/contact
Disallow: /api/comments

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CloudflareBrowserRenderingCrawler
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
