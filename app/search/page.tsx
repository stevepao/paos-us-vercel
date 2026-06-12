import type { Metadata } from "next";
import { PostList } from "@/components/PostList";
import { searchPublicPosts } from "@/lib/wordpress";

export const metadata: Metadata = {
  title: "Search",
  alternates: {
    canonical: "/search/",
  },
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    s?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? params.s ?? "").trim();
  const posts = query ? await searchPublicPosts(query) : [];
  const fieldClass =
    "w-full rounded-xl border border-paos-line bg-white p-4 font-condensed text-base font-light normal-case tracking-normal outline-none transition focus:border-paos-orange focus:ring-2 focus:ring-paos-orange/20";

  return (
    <>
      <h1>Search</h1>
      <form action="/search/" className="mb-12 grid max-w-2xl gap-5" method="get">
        <label className="grid gap-2 font-condensed text-base font-bold uppercase tracking-[0.08em] text-paos-ink">
          Search public posts
          <input className={fieldClass} defaultValue={query} name="q" type="search" />
        </label>
        <button
          className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-7 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink"
          type="submit"
        >
          Search
        </button>
      </form>
      {query ? (
        <section>
          <h2>Results for “{query}”</h2>
          <PostList posts={posts} />
        </section>
      ) : null}
    </>
  );
}
