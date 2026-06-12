import {
  siBluesky,
  siFacebook,
  siInstagram,
  siSubstack,
  siX,
  siYoutube,
} from "simple-icons";

type BrandIcon = {
  path: string;
};

type SocialLink = {
  href?: string;
  label: string;
  icon?: BrandIcon;
  text?: string;
};

const iconClass = "h-4 w-4 fill-current";

export function SocialLinks() {
  const links: SocialLink[] = [
    {
      href: process.env.SOCIAL_LINKEDIN_URL ?? "https://www.linkedin.com/in/stevep",
      label: "LinkedIn",
      text: "in",
    },
    {
      href: process.env.SOCIAL_X_URL ?? "https://www.twitter.com/steve_pao",
      label: "X",
      icon: siX,
    },
    {
      href: process.env.SOCIAL_BLUESKY_URL,
      label: "Bluesky",
      icon: siBluesky,
    },
    {
      href: process.env.SOCIAL_FACEBOOK_URL,
      label: "Facebook",
      icon: siFacebook,
    },
    {
      href: process.env.SOCIAL_INSTAGRAM_URL,
      label: "Instagram",
      icon: siInstagram,
    },
    {
      href: process.env.SOCIAL_SUBSTACK_URL,
      label: "Substack",
      icon: siSubstack,
    },
    {
      href: process.env.SOCIAL_YOUTUBE_URL,
      label: "YouTube",
      icon: siYoutube,
    },
    {
      href: process.env.SOCIAL_LINK_IN_BIO_URL,
      label: "Link in bio",
    },
  ].filter((link) => Boolean(link.href));

  return (
    <div className="mb-24 flex justify-center gap-3">
      {links.map((link) => (
        <a
          aria-label={link.label}
          className="inline-flex h-9 w-9 items-center justify-center bg-black text-base text-white no-underline transition hover:bg-paos-orange hover:text-white"
          href={link.href}
          key={link.label}
          rel="noopener noreferrer"
          target="_blank"
        >
          {link.icon ? (
            <svg aria-hidden="true" className={iconClass} role="img" viewBox="0 0 24 24">
              <path d={link.icon.path} />
            </svg>
          ) : link.text ? (
            link.text
          ) : (
            <svg aria-hidden="true" className={iconClass} role="img" viewBox="0 0 24 24">
              <path d="M10.6 13.4a1.4 1.4 0 0 1 0-2l3.8-3.8a3.6 3.6 0 0 1 5.1 5.1l-1.4 1.4a1 1 0 1 1-1.4-1.4l1.4-1.4a1.6 1.6 0 1 0-2.3-2.3L12 12.8a1.4 1.4 0 0 1-2 0Zm2.8-2.8a1.4 1.4 0 0 1 0 2l-3.8 3.8a3.6 3.6 0 0 1-5.1-5.1l1.4-1.4a1 1 0 1 1 1.4 1.4l-1.4 1.4a1.6 1.6 0 1 0 2.3 2.3l3.8-3.8a1.4 1.4 0 0 1 2 0Z" />
            </svg>
          )}
        </a>
      ))}
    </div>
  );
}
