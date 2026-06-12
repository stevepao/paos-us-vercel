import { cache } from "react";
import {
  getPublicCategorySlugs,
  getPublicPageSlugs,
  getWordPressGraphqlAuthToken,
  getWordPressGraphqlUrl,
  getWordPressRestUrl,
  getWordPressSiteUrl,
} from "@/lib/env";

export const WORDPRESS_TAG = "wordpress";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type WordPressCategory = {
  databaseId: number;
  slug: string;
  name: string;
  uri?: string | null;
};

export type WordPressImage = {
  sourceUrl: string;
  altText?: string | null;
  mediaDetails?: {
    width?: number | null;
    height?: number | null;
  } | null;
};

export type WordPressPost = {
  databaseId: number;
  slug: string;
  uri: string;
  date: string;
  modified: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  commentStatus?: string | null;
  categories: {
    nodes: WordPressCategory[];
  };
  featuredImage?: {
    node?: WordPressImage | null;
  } | null;
};

export type WordPressPage = {
  databaseId: number;
  slug: string;
  uri: string | null;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  modified?: string | null;
};

export type WordPressComment = {
  databaseId: number;
  date: string;
  content: string;
  parentDatabaseId?: number | null;
  author?: {
    node?: {
      name?: string | null;
      url?: string | null;
    } | null;
  } | null;
};

export type SiteSettings = {
  title: string;
  description: string;
  url: string;
  timezone: string;
};

async function wpFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { authenticated?: boolean; revalidate?: number; tags?: string[] },
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const authToken = options?.authenticated ? getWordPressGraphqlAuthToken() : undefined;

  if (authToken) {
    headers["x-paos-graphql-auth"] = authToken;
  }

  const response = await fetch(getWordPressGraphqlUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: {
      revalidate: options?.revalidate ?? 300,
      tags: [WORDPRESS_TAG, ...(options?.tags ?? [])],
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress GraphQL request failed: ${response.status}`);
  }

  const json = (await response.json()) as GraphqlResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }

  if (!json.data) {
    throw new Error("WordPress GraphQL request returned no data.");
  }

  return json.data;
}

export async function wpRestFetch<T>(
  path: string,
  init?: RequestInit & { next?: NextFetchRequestConfig },
): Promise<T> {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${getWordPressRestUrl()}${pathname}`, {
    ...init,
    next: {
      revalidate: 300,
      tags: [WORDPRESS_TAG],
      ...init?.next,
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress REST request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

const POST_FIELDS = `
  databaseId
  slug
  uri
  date
  modified
  title
  excerpt
  content
  commentStatus
  categories {
    nodes {
      databaseId
      slug
      name
      uri
    }
  }
  featuredImage {
    node {
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
`;

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const data = await wpFetch<{ generalSettings: SiteSettings }>(
    `
      query SiteSettings {
        generalSettings {
          title
          description
          url
          timezone
        }
      }
    `,
    undefined,
    { revalidate: 3600 },
  );

  return data.generalSettings;
});

export const getPostsByCategorySlug = cache(async (categorySlug: string): Promise<WordPressPost[]> => {
  const data = await wpFetch<{ posts: { nodes: WordPressPost[] } }>(
    `
      query PublicPosts($categoryName: String!) {
        posts(first: 100, where: { categoryName: $categoryName }) {
          nodes {
            ${POST_FIELDS}
          }
        }
      }
    `,
    { categoryName: categorySlug },
    { tags: [`wordpress-category-${categorySlug}`] },
  );

  return data.posts.nodes;
});

export const getPublicPosts = cache(async (): Promise<WordPressPost[]> => {
  const postsByCategory = await Promise.all(
    getPublicCategorySlugs().map((categorySlug) => getPostsByCategorySlug(categorySlug)),
  );
  const posts = new Map<number, WordPressPost>();

  for (const post of postsByCategory.flat()) {
    if (isPublicPost(post)) {
      posts.set(post.databaseId, post);
    }
  }

  return [...posts.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
});

export const getAllPosts = cache(async (): Promise<WordPressPost[]> => {
  type AllPostsResponse = {
    posts: {
      nodes: WordPressPost[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
    };
  };

  const posts: WordPressPost[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: AllPostsResponse = await wpFetch<AllPostsResponse>(
      `
        query AllPosts($after: String) {
          posts(first: 100, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
            nodes {
              ${POST_FIELDS}
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      { after },
      { authenticated: true, tags: ["wordpress-all-posts"] },
    );

    posts.push(...data.posts.nodes);
    hasNextPage = data.posts.pageInfo.hasNextPage;
    after = data.posts.pageInfo.endCursor ?? null;

    if (!after) {
      hasNextPage = false;
    }
  }

  return posts;
});

export const getPostBySlug = cache(
  async (slug: string): Promise<WordPressPost | null> => {
    const data = await wpFetch<{ post: WordPressPost | null }>(
      `
        query PostBySlug($slug: ID!) {
          post(id: $slug, idType: SLUG) {
            ${POST_FIELDS}
          }
        }
      `,
      { slug },
      { tags: [`wordpress-post-${slug}`] },
    );

    return data.post;
  },
);

export const getAuthenticatedPostBySlug = cache(
  async (slug: string): Promise<WordPressPost | null> => {
    const data = await wpFetch<{ post: WordPressPost | null }>(
      `
        query AuthenticatedPostBySlug($slug: ID!) {
          post(id: $slug, idType: SLUG) {
            ${POST_FIELDS}
          }
        }
      `,
      { slug },
      {
        authenticated: true,
        tags: [`wordpress-post-${slug}`],
      },
    );

    return data.post;
  },
);

export const getPublicPostBySlug = cache(
  async (slug: string): Promise<WordPressPost | null> => {
    const post = await getPostBySlug(slug);
    return post && isPublicPost(post) ? post : null;
  },
);

export async function searchPublicPosts(query: string): Promise<WordPressPost[]> {
  if (!query.trim()) {
    return [];
  }

  type RestSearchResult = {
    id: number;
    subtype: string;
    url: string;
  };

  const params = new URLSearchParams({
    search: query,
    per_page: "20",
    _fields: "id,url,subtype",
  });

  const results = await wpRestFetch<RestSearchResult[]>(`/wp/v2/search?${params}`);
  const slugs = results
    .filter((result) => result.subtype === "post")
    .map((result) => result.url.split("/").filter(Boolean).at(-1))
    .filter((slug): slug is string => Boolean(slug));

  const posts = await Promise.all(slugs.map((slug) => getPublicPostBySlug(slug)));

  return posts.filter((post): post is WordPressPost => Boolean(post));
}

export const getPageBySlug = cache(
  async (slug: string): Promise<WordPressPage | null> => {
    if (!getPublicPageSlugs().has(slug)) {
      return null;
    }

    const data = await wpFetch<{ page: WordPressPage | null }>(
      `
        query PageBySlug($slug: ID!) {
          page(id: $slug, idType: URI) {
            databaseId
            slug
            uri
            title
            excerpt
            content
            modified
          }
        }
      `,
      { slug: slug === "home" ? "/" : `/${slug}/` },
      { tags: [`wordpress-page-${slug}`] },
    );

    return data.page;
  },
);

export const getCommentsForPost = cache(
  async (postId: number): Promise<WordPressComment[]> => {
    type RestComment = {
      id: number;
      date: string;
      parent: number;
      author_name: string;
      author_url?: string;
      content: {
        rendered: string;
      };
    };

    const comments = await wpRestFetch<RestComment[]>(
      `/wp/v2/comments?post=${postId}&per_page=100&_fields=id,parent,date,author_name,author_url,content`,
      {
        next: {
          tags: [`wordpress-comments-${postId}`],
        },
      },
    );

    return comments.map((comment) => ({
      databaseId: comment.id,
      date: comment.date,
      content: comment.content.rendered,
      parentDatabaseId: comment.parent || null,
      author: {
        node: {
          name: comment.author_name,
          url: comment.author_url,
        },
      },
    }));
  },
);

export function isPublicPost(post: Pick<WordPressPost, "categories">): boolean {
  const publicCategorySlugs = new Set(getPublicCategorySlugs());

  return post.categories.nodes.some(
    (category) => publicCategorySlugs.has(category.slug),
  );
}

export function getBackendLoginUrl(redirectPath: string): string {
  const redirectTo = new URL(redirectPath, getWordPressSiteUrl()).toString();
  const loginUrl = new URL("/login/", getWordPressSiteUrl());
  loginUrl.searchParams.set("redirect_to", redirectTo);
  return loginUrl.toString();
}

export function postMatchesDatedPath(
  post: WordPressPost,
  year: string,
  month: string,
  slug: string,
): boolean {
  return normalizePath(post.uri) === normalizePath(`/${year}/${month}/${slug}/`);
}

export function normalizePath(path: string): string {
  return `/${path.replace(/^\/+|\/+$/g, "")}/`;
}
