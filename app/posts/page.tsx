import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { PostList } from "@/components/PostList";
import { getPublicPosts } from "@/lib/wordpress";

const POSTS_PER_PAGE = 10;

export const metadata: Metadata = {
  title: "Posts",
  alternates: {
    canonical: "/posts/",
  },
};

type PostsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1);
  const posts = await getPublicPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  return (
    <>
      <h1>Posts</h1>
      <PostList posts={pagePosts} />
      <Pagination basePath="/posts/" currentPage={currentPage} totalPages={totalPages} />
    </>
  );
}
