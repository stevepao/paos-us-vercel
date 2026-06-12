import Link from "next/link";
import { NotFoundPostsLink } from "@/components/NotFoundPostsLink";
import { PostList } from "@/components/PostList";
import { getPublicPosts } from "@/lib/wordpress";

export default async function NotFound() {
  const posts = await getPublicPosts();
  const fieldClass =
    "w-full rounded-xl border border-paos-line bg-white p-4 font-condensed text-base font-light normal-case tracking-normal outline-none transition focus:border-paos-orange focus:ring-2 focus:ring-paos-orange/20";

  return (
    <>
      <section className="mb-14 rounded-2xl border border-paos-line bg-zinc-50 p-6 md:p-8">
        <h1>Page Not Found</h1>
        <p className="max-w-2xl text-xl">
          Feel free to browse the posts archives or search through the public posts.
        </p>
        <p className="font-condensed text-sm uppercase tracking-[0.08em]">
          <Link href="/">Home</Link> · <NotFoundPostsLink /> ·{" "}
          <Link href="/search/">Search</Link> ·{" "}
          <Link href="/contact/">Contact Us</Link>
        </p>
        <form action="/search/" className="mt-8 grid max-w-2xl gap-5" method="get">
          <label className="grid gap-2 font-condensed text-base font-bold uppercase tracking-[0.08em] text-paos-ink">
            Search public posts
            <input className={fieldClass} name="q" type="search" />
          </label>
          <button
            className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-7 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink"
            type="submit"
          >
            Search
          </button>
        </form>
      </section>
      <section>
        <h2>Recent Updates</h2>
        <PostList posts={posts.slice(0, 5)} />
      </section>
    </>
  );
}
