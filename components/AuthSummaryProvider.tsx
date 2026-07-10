"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AuthSummary = {
  isAuthConfigured: boolean;
  isSignedIn: boolean;
  canViewAllPosts: boolean;
  isLoaded: boolean;
};

const defaultSummary: AuthSummary = {
  isAuthConfigured: false,
  isSignedIn: false,
  canViewAllPosts: false,
  isLoaded: false,
};

const AuthSummaryContext = createContext<AuthSummary>(defaultSummary);

type AuthSummaryResponse = {
  isAuthConfigured?: boolean;
  isSignedIn?: boolean;
  canViewAllPosts?: boolean;
};

type AuthSummaryProviderProps = {
  children: ReactNode;
  isAuthConfigured: boolean;
};

export function AuthSummaryProvider({
  children,
  isAuthConfigured,
}: AuthSummaryProviderProps) {
  const [summary, setSummary] = useState<AuthSummary>(() => ({
    isAuthConfigured,
    isSignedIn: false,
    canViewAllPosts: false,
    isLoaded: !isAuthConfigured,
  }));

  useEffect(() => {
    if (!isAuthConfigured) {
      return;
    }

    let isMounted = true;

    fetch("/api/auth/summary", { cache: "no-store" })
      .then((response) => response.json() as Promise<AuthSummaryResponse>)
      .then((data) => {
        if (isMounted) {
          setSummary({
            isAuthConfigured: Boolean(data.isAuthConfigured),
            isSignedIn: Boolean(data.isSignedIn),
            canViewAllPosts: Boolean(data.canViewAllPosts),
            isLoaded: true,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSummary({
            isAuthConfigured: true,
            isSignedIn: false,
            canViewAllPosts: false,
            isLoaded: true,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthConfigured]);

  return (
    <AuthSummaryContext.Provider value={summary}>{children}</AuthSummaryContext.Provider>
  );
}

export function useAuthSummary(): AuthSummary {
  return useContext(AuthSummaryContext);
}
