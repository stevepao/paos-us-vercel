"use client";

import Link from "next/link";
import { useAuthSummary } from "@/components/AuthSummaryProvider";

export function AuthorizedNavItems() {
  const { canViewAllPosts } = useAuthSummary();

  if (!canViewAllPosts) {
    return null;
  }

  return (
    <Link
      className="text-paos-ink no-underline transition hover:text-paos-orange"
      href="/all-posts/"
    >
      All Posts
    </Link>
  );
}
