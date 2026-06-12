"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PermissionsResponse = {
  canViewAllPosts?: boolean;
};

export function NotFoundPostsLink() {
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

  return (
    <Link href={canViewAllPosts ? "/all-posts/" : "/posts/"}>
      {canViewAllPosts ? "All Posts" : "Posts"}
    </Link>
  );
}
