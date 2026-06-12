import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostList } from "@/components/PostList";
import { getCategoryTitle } from "@/lib/categories";
import { getPublicCategorySlugs } from "@/lib/env";
import { getBackendLoginUrl, getPostsByCategorySlug, isPublicPost } from "@/lib/wordpress";

const POSTS_PER_PAGE = 10;

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export async function generateStaticParams() {
  return getPublicCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!getPublicCategorySlugs().includes(slug)) {
    return {};
  }

  return {
    title: getCategoryTitle(slug),
    alternates: {
      canonical: `/category/${slug}/`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const requestedPage = Math.max(1, Number(query.page ?? 1) || 1);

  if (!getPublicCategorySlugs().includes(slug)) {
    redirect(getBackendLoginUrl(`/category/${slug}/`));
  }

  const posts = (await getPostsByCategorySlug(slug)).filter(isPublicPost);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  return (
    <>
      <h1>{getCategoryTitle(slug)}</h1>
      <PostList posts={pagePosts} />
      <Pagination
        basePath={`/category/${slug}/`}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </>
  );
}
