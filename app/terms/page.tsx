import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: {
    canonical: "/terms/",
  },
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl">
      <h1>Terms of Use</h1>
      <p>
        This site is operated by Stephen Pao as a family website for sharing
        updates, photos, comments, and related posts. By using this site, you
        agree to use it respectfully and only for its intended personal and
        family-oriented purposes.
      </p>

      <h2>Google Sign-In</h2>
      <p>
        Some features, such as leaving comments or viewing private posts, may
        require Google Sign-In. Access to private posts is limited to approved
        family and friends.
      </p>

      <h2>Comments</h2>
      <p>
        If you leave a comment, please keep it respectful, relevant, and
        appropriate for a family website. Comments may be moderated, edited for
        formatting, or removed.
      </p>

      <h2>Content</h2>
      <p>
        Photos, posts, and other materials on this site are shared for personal
        and family use. Please do not copy, redistribute, or reuse private
        family content without permission.
      </p>

      <h2>Availability</h2>
      <p>
        This site is provided as-is and may change or be unavailable from time
        to time.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, email{" "}
        <a href="mailto:webmaster@hillwork.com">webmaster@hillwork.com</a>.
      </p>
    </article>
  );
}
