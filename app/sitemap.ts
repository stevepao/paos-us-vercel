import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getPublicPosts } from "@/lib/wordpress";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const posts = await getPublicPosts();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/posts/",
    "/contact/",
    "/directions/",
    "/yhpao/",
    "/search/",
    "/category/featured-photo/",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...posts.map((post) => ({
      url: `${siteUrl}${post.uri}`,
      lastModified: new Date(post.modified),
    })),
  ];
}
