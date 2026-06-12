import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, canViewPrivatePosts } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  return NextResponse.json(
    {
      canViewAllPosts: canViewPrivatePosts(session?.user?.email),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
