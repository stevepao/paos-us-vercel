"use client";

import { useState } from "react";
import { useEffect } from "react";
import { signIn, signOut } from "next-auth/react";

type FooterAuthButtonProps = {
  isAuthConfigured: boolean;
};

type SessionResponse = {
  user?: {
    email?: string | null;
  };
};

export function FooterAuthButton({ isAuthConfigured }: FooterAuthButtonProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isAuthConfigured) {
      return;
    }

    let isMounted = true;

    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((session) => {
        if (isMounted) {
          setIsSignedIn(Boolean(session.user?.email));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsSignedIn(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthConfigured]);

  if (!isAuthConfigured) {
    return <span>Sign in unavailable</span>;
  }

  return (
    <button
      className="cursor-pointer border-0 bg-transparent p-0 font-inherit uppercase tracking-[0.08em] text-inherit underline transition hover:text-white hover:no-underline disabled:cursor-wait disabled:opacity-70"
      disabled={isPending}
      onClick={() => {
        const callbackUrl = window.location.href;
        setIsPending(true);

        if (isSignedIn) {
          void signOut({ callbackUrl });
          return;
        }

        void signIn("google", { callbackUrl });
      }}
      type="button"
    >
      {isPending ? "Please wait..." : isSignedIn ? "Log out" : "Log in with Google"}
    </button>
  );
}
