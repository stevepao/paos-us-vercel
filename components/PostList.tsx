import Image from "next/image";
import Link from "next/link";
import { stripHtml } from "@/lib/html";
import type { WordPressPost } from "@/lib/wordpress";

type PostListProps = {
  posts: WordPressPost[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function PostList({ posts }: PostListProps) {
  if (!posts.length) {
    return <p>No public posts are available yet.</p>;
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-10 p-0 md:grid-cols-2 md:gap-x-[2.5641025641%] md:gap-y-12">
      {posts.map((post) => (
        <li key={post.databaseId}>
          <article className="group overflow-hidden rounded-2xl border border-paos-line bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            {post.featuredImage?.node?.sourceUrl ? (
              <Link href={post.uri}>
                <Image
                  alt={post.featuredImage.node.altText ?? ""}
                  className="aspect-[3/2] w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                  height={post.featuredImage.node.mediaDetails?.height ?? 630}
                  src={post.featuredImage.node.sourceUrl}
                  width={post.featuredImage.node.mediaDetails?.width ?? 1200}
                />
              </Link>
            ) : null}
            <div className="p-5">
              <h2 className="mb-2 font-serif text-2xl font-light leading-tight text-paos-ink">
                <Link
                  className="text-paos-ink no-underline transition hover:text-paos-orange"
                  href={post.uri}
                >
                  {stripHtml(post.title)}
                </Link>
              </h2>
              <p className="font-condensed text-sm uppercase tracking-[0.08em] text-paos-orange">
                {dateFormatter.format(new Date(post.date))}
              </p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
