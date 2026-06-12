import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Comments } from "@/components/Comments";
import { PostFeaturedImage } from "@/components/PostFeaturedImage";
import { PostJsonLd } from "@/components/PostJsonLd";
import { WordPressContent } from "@/components/WordPressContent";
import { authOptions, canViewPrivatePosts } from "@/lib/auth";
import { getCategoryTitle, YHPAO_CATEGORY_SLUG } from "@/lib/categories";
import { getPrebuildPostLimit } from "@/lib/env";
import { renderWordPressHtml, stripHtml } from "@/lib/html";
import { buildPostMetadata } from "@/lib/metadata";
import {
  getAuthenticatedPostBySlug,
  getCommentsForPost,
  getPostBySlug,
  getPublicPosts,
  getSiteSettings,
  isPublicPost,
  postMatchesDatedPath,
} from "@/lib/wordpress";

type DatedPostPageProps = {
  params: Promise<{
    year: string;
    month: string;
    slug: string;
  }>;
  searchParams: Promise<{
    allPostsCategory?: string;
    commentStatus?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const commentFormatter = new Intl.NumberFormat("en-US");

export async function generateStaticParams() {
  const posts = await getPublicPosts();

  return posts.slice(0, getPrebuildPostLimit()).map((post) => {
    const [, year, month, slug] = post.uri.split("/");
    return { year, month, slug };
  });
}

export async function generateMetadata({
  params,
}: DatedPostPageProps): Promise<Metadata> {
  const { year, month, slug } = await params;
  const [settings, post] = await Promise.all([getSiteSettings(), getPostBySlug(slug)]);

  if (!post || !postMatchesDatedPath(post, year, month, slug)) {
    return {};
  }

  if (!isPublicPost(post)) {
    const session = await getServerSession(authOptions);

    if (!canViewPrivatePosts(session?.user?.email)) {
      return {};
    }

    return {
      title: stripHtml(post.title),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildPostMetadata(post, settings);
}

export default async function DatedPostPage({
  params,
  searchParams,
}: DatedPostPageProps) {
  const { year, month, slug } = await params;
  const { allPostsCategory, commentStatus } = await searchParams;
  const [settings, initialPost] = await Promise.all([getSiteSettings(), getPostBySlug(slug)]);
  let post = initialPost;

  if (!post || !postMatchesDatedPath(post, year, month, slug)) {
    notFound();
  }

  const publicPost = isPublicPost(post);
  let canViewAllPosts = false;

  if (!publicPost || allPostsCategory) {
    const session = await getServerSession(authOptions);
    canViewAllPosts = canViewPrivatePosts(session?.user?.email);

    if (!publicPost && !canViewAllPosts) {
      notFound();
    }

    if (!publicPost) {
      const authenticatedPost = await getAuthenticatedPostBySlug(slug);

      if (!authenticatedPost || !postMatchesDatedPath(authenticatedPost, year, month, slug)) {
        notFound();
      }

      post = authenticatedPost;
    }
  }

  const comments = publicPost ? await getCommentsForPost(post.databaseId) : [];
  const renderedContent = renderWordPressHtml(post.content);
  const contentHasImage = /<(img|picture|iframe)\b/i.test(renderedContent);
  const isYhPaoPost = post.categories.nodes.some(
    (category) => category.slug === YHPAO_CATEGORY_SLUG,
  );
  const allPostsCategoryMatch = allPostsCategory
    ? post.categories.nodes.find((category) => category.slug === allPostsCategory)
    : undefined;
  const breadcrumbLink = canViewAllPosts && allPostsCategoryMatch
    ? {
        href: `/all-posts/?category=${encodeURIComponent(allPostsCategoryMatch.slug)}`,
        label: `All Posts: ${getCategoryTitle(
          allPostsCategoryMatch.slug,
          allPostsCategoryMatch.name,
        )}`,
      }
    : isYhPaoPost
    ? { href: "/yhpao/", label: "Y.H. Pao" }
    : publicPost
      ? { href: "/category/featured-photo/", label: "Featured Photo" }
      : { href: "/all-posts/", label: "All Posts" };

  return (
    <article>
      <p className="breadcrumb">
        You are here: <Link href="/">Home</Link> /{" "}
        <Link href={breadcrumbLink.href}>{breadcrumbLink.label}</Link> /{" "}
        {stripHtml(post.title)}
      </p>
      <p className="entry-meta">
        {dateFormatter.format(new Date(post.date))} by spao{" "}
        {commentFormatter.format(comments.length)}{" "}
        {comments.length === 1 ? "Comment" : "Comments"}
      </p>
      <h1>{stripHtml(post.title)}</h1>
      {publicPost ? <PostJsonLd post={post} settings={settings} /> : null}
      {!contentHasImage ? <PostFeaturedImage post={post} /> : null}
      <WordPressContent html={renderedContent} />
      <p className="entry-footer-meta">
        Filed Under:{" "}
        {post.categories.nodes.map((category, index) => (
          <span key={category.databaseId}>
            {index > 0 ? ", " : null}
            {category.slug === "featured-photo" ? (
              <Link href="/category/featured-photo/">
                {getCategoryTitle(category.slug, category.name)}
              </Link>
            ) : category.slug === YHPAO_CATEGORY_SLUG ? (
              <Link href="/yhpao/">{getCategoryTitle(category.slug, category.name)}</Link>
            ) : (
              getCategoryTitle(category.slug, category.name)
            )}
          </span>
        ))}
      </p>
      {publicPost ? (
        <Comments comments={comments} post={post} status={commentStatus} />
      ) : null}
    </article>
  );
}
