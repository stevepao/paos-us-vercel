import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions, canViewPrivatePosts } from "@/lib/auth";
import { getCategoryTitle } from "@/lib/categories";
import { stripHtml } from "@/lib/html";
import { getAllPosts, isPublicPost, type WordPressCategory } from "@/lib/wordpress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Posts",
  robots: {
    index: false,
    follow: false,
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type AllPostsPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function AllPostsPage({ searchParams }: AllPostsPageProps) {
  const { category } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!canViewPrivatePosts(session?.user?.email)) {
    notFound();
  }

  const posts = await getAllPosts();
  const categories = getCategoryOptions(posts);
  const selectedCategory = categories.some((option) => option.slug === category)
    ? category
    : "";
  const filteredPosts = selectedCategory
    ? posts.filter((post) =>
        post.categories.nodes.some((postCategory) => postCategory.slug === selectedCategory),
      )
    : posts;

  return (
    <>
      <h1>All Posts</h1>
      <p className="mb-10 max-w-2xl text-xl">
        All posts, including the private ones.
      </p>
      <form
        action="/all-posts/"
        className="mb-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
        method="get"
      >
        <label className="grid flex-1 gap-2 font-condensed text-base font-bold uppercase tracking-[0.08em] text-paos-ink">
          Category
          <select
            className="w-full rounded-xl border border-paos-line bg-white p-4 font-condensed text-base font-light normal-case tracking-normal outline-none transition focus:border-paos-orange focus:ring-2 focus:ring-paos-orange/20"
            defaultValue={selectedCategory}
            name="category"
          >
            <option value="">All Posts</option>
            {categories.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-7 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink"
          type="submit"
        >
          Filter
        </button>
      </form>
      <ol className="grid list-none gap-4 p-0">
        {filteredPosts.map((post) => {
          const publicPost = isPublicPost(post);

          return (
            <li
              className="rounded-2xl border border-paos-line bg-white p-5 shadow-sm"
              key={post.databaseId}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="mb-1 font-serif text-2xl font-light leading-tight text-paos-ink">
                    <Link
                      className="text-paos-ink no-underline transition hover:text-paos-orange"
                      href={getPostHref(post.uri, selectedCategory)}
                    >
                      {stripHtml(post.title)}
                    </Link>
                  </h2>
                  <p className="font-condensed text-sm uppercase tracking-[0.08em] text-paos-orange">
                    {dateFormatter.format(new Date(post.date))}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-paos-line px-3 py-1 font-condensed text-xs uppercase tracking-[0.12em] text-paos-muted">
                  {publicPost ? "Public" : "Private"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function getCategoryOptions(
  posts: Array<{ categories: { nodes: WordPressCategory[] } }>,
): Array<{ slug: string; label: string }> {
  const categories = new Map<string, string>();

  for (const post of posts) {
    for (const category of post.categories.nodes) {
      categories.set(category.slug, getCategoryTitle(category.slug, category.name));
    }
  }

  return [...categories.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getPostHref(uri: string, selectedCategory?: string): string {
  if (!selectedCategory) {
    return uri;
  }

  const params = new URLSearchParams({
    allPostsCategory: selectedCategory,
  });

  return `${uri}?${params}`;
}
