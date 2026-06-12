import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy/",
  },
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <h1>Privacy Policy</h1>
      <p>
        This site is operated by Stephen Pao as a family website for sharing
        updates, photos, and related posts.
      </p>

      <h2>Information We Collect</h2>
      <p>
        If you sign in with Google, we receive basic profile information from
        Google, such as your name and email address. We use this information to
        identify you, allow comment submission, and determine whether you are on
        the approved list for private family posts.
      </p>
      <p>
        If you leave a comment, your comment, name, and email address may be
        stored in the WordPress comment system. Existing comments may be visible
        publicly on public posts.
      </p>
      <p>
        If you use the contact form, we collect the name, email address, and
        message you provide so we can respond to you.
      </p>

      <h2>How We Use Information</h2>
      <p>
        We use collected information only to operate this site, manage comments,
        respond to contact form submissions, and control access to private posts
        for approved family and friends. We do not sell personal information.
      </p>

      <h2>Analytics</h2>
      <p>
        This site uses Vercel Analytics to understand general site traffic and
        usage. Analytics data is used to help maintain and improve the site.
      </p>

      <h2>Cookies And Sessions</h2>
      <p>
        The site may use cookies or similar session storage to keep you signed
        in, support Google authentication, and protect forms from abuse.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        This site uses Google Sign-In for authentication, WordPress as a content
        backend, and may use Cloudflare Turnstile to protect the contact form
        from spam. These services may process information according to their own
        privacy policies.
      </p>

      <h2>Data Requests</h2>
      <p>
        To request deletion of a comment or account-related data associated with
        this site, use the <Link href="/contact/">contact form</Link>.
      </p>

      <h2>Changes</h2>
      <p>
        This policy may be updated as the site changes. The current version will
        be posted on this page.
      </p>
    </article>
  );
}
