import sanitizeHtml from "sanitize-html";
import {
  getSiteUrl,
  getWordPressMediaBaseUrl,
  getWordPressSiteUrl,
} from "@/lib/env";

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  "figure",
  "figcaption",
  "img",
  "picture",
  "source",
  "video",
  "iframe",
  "h1",
  "h2",
  "section",
]);

const allowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  "*": ["class", "id", "aria-describedby", "dir"],
  a: ["href", "name", "target", "rel", "class", "id"],
  img: [
    "src",
    "srcset",
    "sizes",
    "alt",
    "width",
    "height",
    "loading",
    "decoding",
    "class",
  ],
  source: ["src", "srcset", "sizes", "type", "media"],
  video: [
    "autoplay",
    "class",
    "controls",
    "height",
    "loop",
    "muted",
    "playsinline",
    "poster",
    "preload",
    "src",
    "width",
  ],
  iframe: [
    "src",
    "width",
    "height",
    "title",
    "allow",
    "allowfullscreen",
    "loading",
    "referrerpolicy",
  ],
};

const allowedSchemes = ["http", "https", "mailto", "tel"];

export function renderWordPressHtml(html?: string | null): string {
  if (!html) {
    return "";
  }

  const rewritten = rewriteWordPressUrls(html);

  return sanitizeHtml(rewritten, {
    allowedTags,
    allowedAttributes,
    allowedSchemes,
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "player.vimeo.com",
      "videopress.com",
    ],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.href?.startsWith("http") ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}

export function stripHtml(html?: string | null): string {
  if (!html) {
    return "";
  }

  return decodeHtmlEntities(sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  }))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function rewriteWordPressUrls(html: string): string {
  return html
    .replace(/\b(href|src)=["']([^"']+)["']/gi, (_match, attr: string, url: string) => {
      return `${attr}="${rewriteWordPressUrl(url)}"`;
    })
    .replace(/\bposter=["']([^"']+)["']/gi, (_match, url: string) => {
      return `poster="${rewriteWordPressUrl(url)}"`;
    })
    .replace(/\bsrcset=["']([^"']+)["']/gi, (_match, srcset: string) => {
      return `srcset="${rewriteSrcset(srcset)}"`;
    });
}

function rewriteSrcset(srcset: string): string {
  return srcset
    .split(",")
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const url = parts.shift();
      if (!url) {
        return entry.trim();
      }

      return [rewriteWordPressUrl(url), ...parts].join(" ");
    })
    .join(", ");
}

function rewriteWordPressUrl(rawUrl: string): string {
  if (rawUrl.startsWith("#") || rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("//")) {
    return `https:${rawUrl}`;
  }

  try {
    const wordpressUrl = new URL(getWordPressSiteUrl());
    const parsed = new URL(rawUrl, getWordPressSiteUrl());

    if (parsed.hostname !== wordpressUrl.hostname) {
      if (parsed.protocol === "http:" && isHttpsSafeEmbedHost(parsed.hostname)) {
        parsed.protocol = "https:";
        return parsed.toString();
      }

      return rawUrl;
    }

    if (parsed.pathname.startsWith("/wp-content/uploads/")) {
      const mediaBase = new URL(getWordPressMediaBaseUrl());
      const mediaPath = parsed.pathname.replace(/^\/wp-content\/uploads\/?/, "");
      return `${mediaBase.toString().replace(/\/+$/, "")}/${mediaPath}${parsed.search}${parsed.hash}`;
    }

    const frontend = new URL(getSiteUrl());
    parsed.protocol = frontend.protocol;
    parsed.host = frontend.host;
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function isHttpsSafeEmbedHost(hostname: string): boolean {
  return [
    "youtube.com",
    "www.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
  ].includes(hostname);
}
