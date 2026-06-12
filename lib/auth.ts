import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getAuthorizedGoogleEmails, getOptionalEnv } from "@/lib/env";

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getOptionalEnv("AUTH_GOOGLE_ID") && getOptionalEnv("AUTH_GOOGLE_SECRET"));
}

export function canViewPrivatePosts(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return getAuthorizedGoogleEmails().has(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: isGoogleAuthConfigured()
    ? [
        GoogleProvider({
          clientId: getOptionalEnv("AUTH_GOOGLE_ID")!,
          clientSecret: getOptionalEnv("AUTH_GOOGLE_SECRET")!,
        }),
      ]
    : [],
  secret: getOptionalEnv("AUTH_SECRET") ?? getOptionalEnv("NEXTAUTH_SECRET"),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};
