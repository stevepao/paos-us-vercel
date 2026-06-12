import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Contact Us",
  alternates: {
    canonical: "/contact/",
  },
};

type ContactPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { status } = await searchParams;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY;
  const noticeClass = "mb-6 rounded-xl border border-paos-line bg-zinc-50 p-4";
  const labelClass =
    "grid gap-2 font-condensed text-base font-bold uppercase tracking-[0.08em] text-paos-ink";
  const fieldClass =
    "w-full rounded-xl border border-paos-line bg-white p-4 font-condensed text-base font-light normal-case tracking-normal outline-none transition focus:border-paos-orange focus:ring-2 focus:ring-paos-orange/20";

  return (
    <article>
      <h1>Contact Us</h1>
      <p className="mb-8 max-w-2xl text-xl">Drop us a note using this form!</p>
      {status === "sent" ? (
        <p className={noticeClass}>Thanks. Your message has been sent.</p>
      ) : null}
      {status === "missing-config" ? (
        <p className={noticeClass}>
          Contact email is not configured yet. Set the SMTP environment variables
          to enable this form.
        </p>
      ) : null}
      {status === "missing-fields" ? (
        <p className={noticeClass}>Please fill out all contact form fields.</p>
      ) : null}
      {status === "invalid-email" ? (
        <p className={noticeClass}>Please enter a valid email address.</p>
      ) : null}
      {status === "too-long" ? (
        <p className={noticeClass}>Please shorten your message and try again.</p>
      ) : null}
      {status === "turnstile-failed" ? (
        <p className={noticeClass}>Please complete the verification and try again.</p>
      ) : null}
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}
      <form action="/api/contact" className="grid max-w-2xl gap-5" method="post">
        <label className={labelClass}>
          Name
          <input className={fieldClass} autoComplete="name" name="name" required />
        </label>
        <label className={labelClass}>
          Email
          <input
            className={fieldClass}
            autoComplete="email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className={labelClass}>
          Comment or Message
          <textarea className={fieldClass} name="message" required rows={6} />
        </label>
        <label className="hp-field" aria-hidden="true">
          Website
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
          />
        ) : null}
        <button
          className="inline-flex w-fit items-center justify-center rounded-full bg-paos-orange px-7 py-3 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-paos-ink"
          type="submit"
        >
          Submit
        </button>
      </form>
    </article>
  );
}
