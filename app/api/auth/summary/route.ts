import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, canViewPrivatePosts, isGoogleAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthConfigured = isGoogleAuthConfigured();

  if (!isAuthConfigured) {
    return NextResponse.json(
      {
        isAuthConfigured: false,
        isSignedIn: false,
        canViewAllPosts: false,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  return NextResponse.json(
    {
      isAuthConfigured: true,
      isSignedIn: Boolean(email),
      canViewAllPosts: canViewPrivatePosts(email),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
