import { PostList } from "@/components/PostList";
import { getPublicPosts, getSiteSettings } from "@/lib/wordpress";

export default async function HomePage() {
  const [settings, posts] = await Promise.all([getSiteSettings(), getPublicPosts()]);

  return (
    <>
      <p className="mb-16 max-w-md font-serif text-4xl font-light leading-[1.08] text-paos-ink md:mb-20 md:text-5xl">
        {settings.description}
      </p>
      <section>
        <PostList posts={posts.slice(0, 8)} />
      </section>
    </>
  );
}
