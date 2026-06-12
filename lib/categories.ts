export const YHPAO_CATEGORY_SLUG = "yhpao";

export function getCategoryTitle(slug: string, fallbackName?: string | null): string {
  if (slug === "featured-photo") {
    return "Featured Photo";
  }

  if (slug === YHPAO_CATEGORY_SLUG) {
    return "Y.H. Pao";
  }

  if (fallbackName?.trim()) {
    return fallbackName;
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
