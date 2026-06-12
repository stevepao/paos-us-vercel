import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getRevalidateSecret } from "@/lib/env";
import { WORDPRESS_TAG } from "@/lib/wordpress";

export const runtime = "nodejs";

type RevalidatePayload = {
  slug?: string;
  uri?: string;
  post?: {
    post_name?: string;
  };
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const secret = getRevalidateSecret();

  if (!secret || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as RevalidatePayload;
  const slug = payload.slug ?? payload.post?.post_name;

  revalidateTag(WORDPRESS_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/posts/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed/");
  revalidatePath("/feed.xml");

  if (payload.uri) {
    revalidatePath(payload.uri);
  }

  if (slug) {
    revalidateTag(`wordpress-post-${slug}`, { expire: 0 });
  }

  return NextResponse.json({ ok: true, slug });
}

export async function GET(request: Request) {
  return POST(request);
}
