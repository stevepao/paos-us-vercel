"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useAuthSummary } from "@/components/AuthSummaryProvider";

export function FooterAuthButton() {
  const { isAuthConfigured, isSignedIn } = useAuthSummary();
  const [isPending, setIsPending] = useState(false);

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
