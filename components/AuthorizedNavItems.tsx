"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PermissionsResponse = {
  canViewAllPosts?: boolean;
};

export function AuthorizedNavItems() {
  const [canViewAllPosts, setCanViewAllPosts] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/permissions", { cache: "no-store" })
      .then((response) => response.json() as Promise<PermissionsResponse>)
      .then((permissions) => {
        if (isMounted) {
          setCanViewAllPosts(Boolean(permissions.canViewAllPosts));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCanViewAllPosts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
