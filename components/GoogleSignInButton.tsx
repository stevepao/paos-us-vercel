"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  callbackUrl: string;
};

export function GoogleSignInButton({ callbackUrl }: GoogleSignInButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <button
      className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-6 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink disabled:cursor-wait disabled:opacity-70"
      disabled={isSigningIn}
      onClick={() => {
        setIsSigningIn(true);
        void signIn("google", { callbackUrl });
      }}
      type="button"
    >
      {isSigningIn ? "Redirecting..." : "Sign in with Google"}
    </button>
  );
}
