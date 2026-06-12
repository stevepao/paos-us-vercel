import Link from "next/link";
import type { ReactNode } from "react";
import { AuthorizedNavItems } from "@/components/AuthorizedNavItems";
import { FooterAuthButton } from "@/components/FooterAuthButton";
import { isGoogleAuthConfigured } from "@/lib/auth";
import type { SiteSettings } from "@/lib/wordpress";

type SiteShellProps = {
  settings: SiteSettings;
  children: ReactNode;
};

export function SiteShell({ settings, children }: SiteShellProps) {
  return (
    <>
      <header className="border-b border-paos-line bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-condensed text-xl font-light uppercase leading-tight tracking-[0.14em] text-paos-ink">
              <Link className="no-underline transition hover:text-paos-orange" href="/">
                {settings.title}
              </Link>
            </p>
            <nav
              className="flex flex-wrap gap-x-8 gap-y-2 font-condensed text-lg uppercase tracking-[0.08em]"
              aria-label="Main navigation"
            >
              <Link className="text-paos-ink no-underline transition hover:text-paos-orange" href="/">
                Home
              </Link>
              <Link
                className="text-paos-ink no-underline transition hover:text-paos-orange"
                href="/directions/"
              >
                Directions
              </Link>
              <Link
                className="text-paos-ink no-underline transition hover:text-paos-orange"
                href="/contact/"
              >
                Contact Us
              </Link>
              <AuthorizedNavItems />
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-12 md:py-16">{children}</main>
      <footer className="min-h-64 bg-paos-ink px-4 py-16 font-condensed text-sm uppercase tracking-[0.08em] text-zinc-300">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-24 flex justify-center gap-3">
            <a
              className="inline-flex h-9 w-9 items-center justify-center bg-black text-base text-white no-underline transition hover:bg-paos-orange hover:text-white"
              href="https://www.linkedin.com/in/stevep"
              aria-label="LinkedIn"
            >
              in
            </a>
            <a
              className="inline-flex h-9 w-9 items-center justify-center bg-black text-base text-white no-underline transition hover:bg-paos-orange hover:text-white"
              href="https://www.twitter.com/steve_pao"
              aria-label="Twitter"
            >
              x
            </a>
          </div>
          <div className="text-left">
            Copyright © {new Date().getFullYear()} · Stephen Pao ·{" "}
            <Link className="text-inherit" href="/privacy/">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link className="text-inherit" href="/terms/">
              Terms
            </Link>{" "}
            · <FooterAuthButton isAuthConfigured={isGoogleAuthConfigured()} />
          </div>
        </div>
      </footer>
    </>
  );
}
