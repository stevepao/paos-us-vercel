import { PostList } from "@/components/PostList";
import { getPublicPosts, getSiteSettings } from "@/lib/wordpress";

export default async function HomePage() {
  const [settings, posts] = await Promise.all([getSiteSettings(), getPublicPosts()]);

  return (
    <>
      <p className="mb-16 max-w-md font-serif text-4xl font-light leading-[1.08] text-paos-ink md:mb-20 md:text-5xl">
        {settings.description}
      </p>
      <p className="mb-12 max-w-2xl text-xl leading-relaxed text-paos-muted">
        Pao Family is a family website for sharing updates, photos, and related
        posts. Google Sign-In is used so approved family and friends can leave
        comments and access private family posts.
      </p>
      <section>
        <PostList posts={posts.slice(0, 8)} />
      </section>
    </>
  );
}
