"use client";

import Link from "next/link";
import { useAuthSummary } from "@/components/AuthSummaryProvider";

export function NotFoundPostsLink() {
  const { canViewAllPosts } = useAuthSummary();

  return (
    <Link href={canViewAllPosts ? "/all-posts/" : "/posts/"}>
      {canViewAllPosts ? "All Posts" : "Posts"}
    </Link>
  );
}
