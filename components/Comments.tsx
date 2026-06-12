import { getServerSession } from "next-auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { isGoogleAuthConfigured, authOptions } from "@/lib/auth";
import { renderWordPressHtml, stripHtml } from "@/lib/html";
import type { WordPressComment, WordPressPost } from "@/lib/wordpress";

type CommentsProps = {
  post: WordPressPost;
  comments: WordPressComment[];
  status?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export async function Comments({ post, comments, status }: CommentsProps) {
  const session = await getServerSession(authOptions);
  const authConfigured = isGoogleAuthConfigured();

  return (
    <section className="mt-16 border-t border-paos-line pt-12" id="comments">
      <h2 className="mb-8 font-serif text-4xl font-light leading-tight text-paos-ink">
        Comments
      </h2>
      {comments.length ? (
        <ol className="grid list-none gap-6 p-0">
          {comments.map((comment) => (
            <li
              className="rounded-2xl border border-paos-line bg-white/80 p-6 shadow-sm"
              key={comment.databaseId}
            >
              <p className="mb-4 font-condensed text-sm uppercase tracking-[0.08em] text-paos-orange">
                {comment.author?.node?.name ?? "Anonymous"} ·{" "}
                {dateFormatter.format(new Date(comment.date))}
              </p>
              <div
                className="wp-content"
                dangerouslySetInnerHTML={{
                  __html: renderWordPressHtml(comment.content),
                }}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p>No comments yet.</p>
      )}

      {post.commentStatus === "open" ? (
        <div className="mt-10 rounded-2xl border border-paos-line bg-zinc-50 p-6">
          <h3 className="mb-5 font-serif text-3xl font-light leading-tight text-paos-ink">
            Leave a Reply
          </h3>
          {status === "submitted" ? (
            <p className="mb-5 border border-paos-line bg-white p-4">
              Thanks. Your comment was submitted to WordPress and may be awaiting
              moderation.
            </p>
          ) : null}
          {status === "failed" ? (
            <p className="mb-5 border border-paos-line bg-white p-4">
              WordPress did not accept the comment. This may need a WordPress
              REST comment setting or an authenticated server-side integration.
            </p>
          ) : null}
          {status === "missing-fields" ? (
            <p className="mb-5 border border-paos-line bg-white p-4">
              Please enter a comment before submitting.
            </p>
          ) : null}
          {status === "not-public" ? (
            <p className="mb-5 border border-paos-line bg-white p-4">
              Comments are only available on public posts.
            </p>
          ) : null}
          {!authConfigured ? (
            <p className="mb-5 border border-paos-line bg-white p-4">
              Google sign-in is not configured yet. Existing comments are visible,
              but new comment submission is disabled locally until
              `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` are set.
            </p>
          ) : session?.user?.email ? (
            <form action="/api/comments" className="grid gap-5" method="post">
              <input name="postId" type="hidden" value={post.databaseId} />
              <input name="redirectTo" type="hidden" value={post.uri} />
              <p className="font-condensed text-sm uppercase tracking-[0.08em] text-paos-orange">
                Signed in as {stripHtml(session.user.name ?? session.user.email)}
              </p>
              <label className="grid gap-2 font-condensed text-base font-bold uppercase tracking-[0.08em] text-paos-ink">
                Comment
                <textarea
                  className="w-full rounded-xl border border-paos-line bg-white p-4 font-condensed text-base font-light normal-case tracking-normal outline-none transition focus:border-paos-orange focus:ring-2 focus:ring-paos-orange/20"
                  name="comment"
                  required
                  rows={5}
                />
              </label>
              <button
                className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-6 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink"
                type="submit"
              >
                Post Comment
              </button>
            </form>
          ) : (
            <div className="grid gap-4">
              <p className="max-w-2xl">
                Please sign in with Google to leave a comment. Existing comments
                are still visible without signing in.
              </p>
              <GoogleSignInButton callbackUrl={post.uri} />
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
