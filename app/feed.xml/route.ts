import { buildRssFeed } from "@/lib/xml";

export const revalidate = 3600;

export async function GET() {
  const feed = await buildRssFeed();

  return new Response(feed, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
    },
  });
}
