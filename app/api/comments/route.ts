import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isGoogleAuthConfigured } from "@/lib/auth";
import { getOptionalEnv, getWordPressRestUrl } from "@/lib/env";
import { getPublicPostBySlug } from "@/lib/wordpress";

export const runtime = "nodejs";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    googleAuthConfigured: isGoogleAuthConfigured(),
    wordpressCommentCredentialsConfigured: Boolean(
      getOptionalEnv("WORDPRESS_COMMENTS_USERNAME") &&
        getOptionalEnv("WORDPRESS_COMMENTS_APPLICATION_PASSWORD"),
    ),
    wordpressRestUrlConfigured: Boolean(getWordPressRestUrl()),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const formData = await request.formData();
  const postId = Number(formData.get("postId"));
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  const comment = String(formData.get("comment") ?? "").trim();
  const redirectUrl = new URL(redirectTo, request.url);

  if (!session?.user?.email) {
    return NextResponse.redirect(
      new URL(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectTo)}`, request.url),
    );
  }

  if (!postId || !comment) {
    redirectUrl.searchParams.set("commentStatus", "missing-fields");
    return NextResponse.redirect(redirectUrl);
  }

  const slug = redirectTo.split("/").filter(Boolean).at(-1);
  if (!slug || !(await getPublicPostBySlug(slug))) {
    redirectUrl.searchParams.set("commentStatus", "not-public");
    return NextResponse.redirect(redirectUrl);
  }

  const headers = new Headers({
    "content-type": "application/json",
  });
  const wordpressUsername = getOptionalEnv("WORDPRESS_COMMENTS_USERNAME");
  const wordpressPassword = getOptionalEnv("WORDPRESS_COMMENTS_APPLICATION_PASSWORD");

  if (wordpressUsername && wordpressPassword) {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString("base64")}`,
    );
  }

  const response = await fetch(`${getWordPressRestUrl()}/wp/v2/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      post: postId,
      content: comment,
      author_name: session.user.name ?? session.user.email,
      author_email: session.user.email,
    }),
  });

  if (!response.ok) {
    redirectUrl.searchParams.set("commentStatus", "failed");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("commentStatus", "submitted");
  return NextResponse.redirect(redirectUrl);
}
